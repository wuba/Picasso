/**
 * designTokens 聚合：画板 + 组件定义树去重汇总。
 *
 * 目标：把画板里反复用到的颜色 / 文本样式抽成字典，节点侧只存 token key 引用（省体积 + 集中改）。
 *
 * 数据来源两种：
 *   1) 高频值聚合——统计所有节点的 fills/borders 颜色 与 text runs 样式，出现 ≥2 次的抽出来
 *   2) 共享样式回填——Sketch 有共享文本样式（sharedTextStyleName）时优先作为 sourceName 保留原名
 *
 * 一期未实现的两种来源（**Color Variables / swatches**）：文档级数据，画板级 sketch.export 拿不到
 * 变量名，降级为高频值自动命名（color-1 / text-1 按使用频次排序）。
 *
 * 输出规则：
 *   - key 统一为 color-N / text-N（N 按 usages 降序编号，方便消费方按频次遍历）
 *   - Sketch 共享文本样式原名落 sourceName 字段，不参与 key 命名（避免与自动命名混杂）
 *   - 限制上限 COLOR_LIMIT / TEXT_STYLE_LIMIT，防长尾杂色炸字典
 */
import { SKLayer } from '../types';
import { RestoreDesignTokens } from './restoreTypes';
import { fillsToRestore, bordersToRestore, textRunsToRestore, textStyleKey } from './normalize';

// 上限：控制字典体积；超过则丢弃长尾。24 色 / 16 文本样式覆盖率实测 >95% 常见画板
const COLOR_LIMIT = 24;
const TEXT_STYLE_LIMIT = 16;

/** 颜色使用统计（聚合阶段用，最终转成 tokens.colors 的 entry） */
type ColorStat = {
    value: string;  // #rrggbbaa 归一化色值（与 mapNode 输出同源，保证节点侧 fills[].color 能反查命中）
    usages: number; // 引用次数（≥2 才抽出，见 aggregateDesignTokens 的过滤逻辑）
};

/** 文本样式使用统计（聚合阶段用，最终转成 tokens.textStyles 的 entry） */
type TextStat = {
    font?: string;       // PostScript 字体名（如 PingFangSC-Medium）
    size?: number;       // 字号（pt）
    color?: string;      // 字色 #rrggbbaa
    lineHeight?: number; // 显式行高（pt）；未设时消费方回退 effectiveLineHeight
    usages: number;      // 引用次数（每段 run 计一次；≥2 或有 sharedName 才抽出）
    sharedName?: string; // Sketch 共享文本样式原名（若节点关联了共享样式，落 tokens.textStyles[].sourceName）
};

/**
 * 深度遍历图层树，统计每个颜色 hex / 文本样式 key 的出现次数。
 * 原地累加到入参 colors / texts 字典——聚合多棵树时同 hex/key 计数会自然叠加。
 */
const collect = (layer: SKLayer, colors: { [hex: string]: ColorStat }, texts: { [key: string]: TextStat }): void => {
    const bumpColor = (hex?: string): void => {
        if (!hex) return;
        if (!colors[hex]) colors[hex] = { value: hex, usages: 0 };
        colors[hex].usages++;
    };

    // 与 mapNode 输出同源取色（fillsToRestore 已把 fill 级 contextSettings.opacity 并入 alpha 段），
    // 保证登记进 token 表的 hex 与节点 fills[].color 完全一致，linkTokens 查表才能命中
    fillsToRestore(layer).forEach((fill) => bumpColor(fill.color));
    bordersToRestore(layer).forEach((border) => bumpColor(border.color));

    if (layer._class === 'text' && layer.attributedString) {
        // 一个 text 节点可能有多段 runs（分段字体/字号/字色）——每段独立计入统计
        textRunsToRestore(layer).forEach((run) => {
            bumpColor(run.color);

            // textStyleKey：把 (font, size, color, lineHeight) 归一化为字符串键；相同样式必生成相同 key，
            // 保证同样样式的 runs 汇总到同一条 TextStat
            const key = textStyleKey(run);
            if (!texts[key]) {
                texts[key] = {
                    font: run.font,
                    size: run.size,
                    color: run.color,
                    lineHeight: run.lineHeight,
                    usages: 0,
                };
            }
            texts[key].usages++;

            // 共享文本样式名优先作为 token 名（插件端已回填 sharedTextStyleName）。
            // `&& !texts[key].sharedName` 保证首次赋值不被后续覆盖——同一样式在不同节点上，
            // 只有部分节点关联了共享样式时，仍能捕获到共享名而非静默丢失
            if (layer.sharedTextStyleName && !texts[key].sharedName) {
                texts[key].sharedName = layer.sharedTextStyleName;
            }
        });
    }

    // 递归子树（画板导出的图层树本身就有 layers 数组）
    if (Array.isArray(layer.layers)) {
        layer.layers.forEach(child => collect(child, colors, texts));
    }
};

/**
 * 聚合入口。多棵树入参用于同时喂画板主树 + 各组件定义树——同一颜色跨树出现时使用次数累加。
 *
 * @param trees 参与聚合的树列表（画板 + 各组件定义树），单树入参兼容保留
 */
export const aggregateDesignTokens = (trees: SKLayer | SKLayer[]): RestoreDesignTokens => {
    // —— 收集阶段：递归两棵/多棵树累加统计 ——
    const colorStats: { [hex: string]: ColorStat } = {};
    const textStats: { [key: string]: TextStat } = {};
    (Array.isArray(trees) ? trees : [trees]).forEach(tree => collect(tree, colorStats, textStats));

    const tokens: RestoreDesignTokens = {};

    // —— 颜色字典 ——
    const colorList = Object.keys(colorStats)
        .map(hex => colorStats[hex])
        // 只用一次的颜色不抽 token——引用一次反而增体积；`>= 2` 是"抽出来才划算"的阈值
        .filter(stat => stat.usages >= 2)
        // 排序：usages 降序（高频优先编号 color-1），同频按 hex 字典序（确定性 tiebreak，
        // 保证同一输入两次运行产生完全一致的 key 分配，diff 才不会误判 token 重命名）
        .sort((a, b) => b.usages - a.usages || (a.value < b.value ? -1 : 1))
        .slice(0, COLOR_LIMIT);

    if (colorList.length) {
        tokens.colors = {};
        colorList.forEach((stat, i) => {
            tokens.colors![`color-${i + 1}`] = { value: stat.value, usages: stat.usages };
        });
    }

    // —— 文本样式字典 ——
    const textList = Object.keys(textStats)
        .map(key => textStats[key])
        // 共享样式即使只用一次也保留（sharedName 存在说明设计师显式建了样式，token 化有语义价值）
        .filter(stat => stat.usages >= 2 || !!stat.sharedName)
        // 同频按 font 字典序（确定性 tiebreak，同颜色排序）
        .sort((a, b) => b.usages - a.usages || ((a.font || '') < (b.font || '') ? -1 : 1))
        .slice(0, TEXT_STYLE_LIMIT);

    if (textList.length) {
        tokens.textStyles = {};
        // key 统一为 text-N（按使用频次编号）；Sketch 共享样式原名落 sourceName，
        // 避免共享样式全名与自动命名混杂导致消费方无法按 key 规律遍历
        textList.forEach((stat, i) => {
            const entry: any = { usages: stat.usages };
            if (stat.font) entry.font = stat.font;
            if (stat.size !== undefined) entry.size = stat.size;
            if (stat.color) entry.color = stat.color;
            if (stat.lineHeight !== undefined) entry.lineHeight = stat.lineHeight;
            if (stat.sharedName) entry.sourceName = stat.sharedName;
            tokens.textStyles![`text-${i + 1}`] = entry;
        });
    }

    return tokens;
};

export default aggregateDesignTokens;
