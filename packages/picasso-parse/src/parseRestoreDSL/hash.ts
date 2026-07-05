/**
 * 稳定 ID（UUID 短哈希）与内容指纹（contentHash / styleHash / subtreeHash）。
 *
 * ─ shortHash ─────────────────────────────────────────────────────────────
 *   对 UUID 做 sha1 取前 8 位十六进制；全画板查重，碰撞时该节点延至 12 位。
 *   stableId、restoreComponentKey 均由此构造。
 *
 * ─ contentHash ───────────────────────────────────────────────────────────
 *   节点归一化属性签名的 sha1 前 8 位。签名字段：
 *     类型 / frame / visible / rotation / opacity / flip / windingRule /
 *     booleanOp / artboard 背景 / constraints / stack / borderRadius /
 *     fills / borders / shadows / innerShadows / blur /
 *     text（string + runs + textBehaviour + verticalAlign）/ image / path
 *   刻意不含 id / name / children / 绝对坐标——name 是 diff 模糊配对的独立
 *   打分信号，绝对坐标随父级移动漂移，children 由 subtreeHash 单独覆盖。
 *   已知盲区（历史指纹零漂移的刻意取舍，restore.test.ts 有断言）：groupBehavior
 *   与 fills/tint 分类语义不入指纹——同值 fills 的普通编组与 Frame 容器 hash
 *   相同，两态切换（着色提示 ↔ 真实背景）视觉变化但 contentHash 不变，diff 端
 *   需另行比对。
 *
 * ─ styleHash ────────────────────────────────────────────────────────────
 *   与 contentHash 同签名但**去掉 frame**，sha1 前 8 位。让消费方能识别
 *   「仅移动未改样式」（contentHash 变而 styleHash 不变 → moved）；几何差异
 *   消费方直接比对节点 frame 字段，不再造第三个 hash。
 *
 * ─ subtreeHash ──────────────────────────────────────────────────────────
 *   Merkle：sha1(contentHash + 有序 children.subtreeHash) 前 8 位。后序遍历，
 *   子树任一节点变化都会冒泡到根——diff 快速裁枝。
 *
 * 三者共用 contentSignature；差别只在「输入是否含 frame」与「是否递归子树」。
 * 类型层字段说明见 packages/picasso-dsl/src/Component/BaseComponent.ts。
 */
import { SKLayer } from '../types';
import sha1 from './sha1';
import {
    round2,
    restoreTypeOf,
    decodeConstraints,
    decodeStack,
    borderRadiusToRestore,
    fillsToRestore,
    bordersToRestore,
    shadowsToRestore,
    blurToRestore,
    textRunsToRestore,
    textResizingToRestore,
    verticalAlignToRestore,
    pointsToSvgPath,
    flipToRestore,
    windingRuleToRestore,
    booleanOpToRestore,
    colorToHex,
} from './normalize';

/**
 * 短哈希分配上下文——全画板/全 annotate 调用共享一份，保证：
 *   1) 同一 UUID 永远得到同一短哈希（assigned 缓存）；
 *   2) 不同 UUID 抢到同一短前缀时，后到者延长到 12 位（used 反查）。
 * 生命周期与一次 annotateStableIds 调用相同，跨调用不复用（新画板重开）。
 */
export type ShortHashContext = {
    // 短哈希 → 已占用该短哈希的 UUID（碰撞检测的反查表）
    used: { [short: string]: string };
    // UUID → 已分配短哈希（同一 UUID 永远同值，同调用内幂等）
    assigned: { [uuid: string]: string };
};

/** 每次 annotate 入口调用一次；不要复用上一次的 ctx，会串数据。 */
export const createShortHashContext = (): ShortHashContext => ({ used: {}, assigned: {} });

/**
 * UUID → 短哈希（默认 8 位十六进制 = 4B 值域，同画板下碰撞概率忽略；碰撞时该节点延至 12 位）。
 * 幂等：同一 (uuid, ctx) 多次调用返回同值。
 * 用途：stableId 主体、复合路径每一段、restoreComponentKey（symbolID → 短哈希）。
 */
export const shortHashOf = (uuid: string, ctx: ShortHashContext): string => {
    // 命中缓存直接返回——同一 UUID 在同一 ctx 内必须永远同值，否则复合路径拼装会漂移
    if (ctx.assigned[uuid]) return ctx.assigned[uuid];
    const full = sha1(uuid);
    let short = full.slice(0, 8);
    if (ctx.used[short] && ctx.used[short] !== uuid) {
        // 碰撞兜底（概率可忽略但必须处理，否则两个 UUID 会共享一个 stableId）：延长至 12 位。
        // 只有这个节点变长，其余保持 8 位，节省整体体积
        short = full.slice(0, 12);
    }
    ctx.used[short] = uuid;
    ctx.assigned[uuid] = short;
    return short;
};

/**
 * 节点内容签名——contentHash / styleHash 的共同输入。
 *
 * 设计不变量：
 *  1) 与 mapNode 输出**同源同 normalize**（共用 normalize.ts 纯函数）——改归一化即改指纹，
 *     属实现变更，靠 parserVersion 溯源；contentSignature 与 mapNode 不同步会让指纹
 *     语义偏离实际 DSL 语义。
 *  2) 固定 key 顺序（源码书写顺序即序列化顺序），JSON.stringify 才能确定性输出。
 *  3) 缺省值不进签名（`if (x) sig.x = x`）——历史指纹零漂移的关键：新增可选归一化字段
 *     不会破坏老输入的 hash 稳定性。
 *  4) 三个刻意剔除：name（模糊配对独立信号）/ 绝对坐标（父级移动全体漂移）/ children
 *     （由 subtreeHash 单独覆盖，避免双重计入）。
 *
 * @param withGeometry
 *   true  → contentHash 输入：含 frame，标识「样式 + 位置」的完整节点内容
 *   false → styleHash 输入：去掉 frame，仅样式签名。让 diff 消费方能识别「仅移动未改样式」
 *           （contentHash 变、styleHash 不变 → moved 类别）；因为 contentHash 含 f 意味着
 *           「插入一行导致同级整体下移」会让下方所有节点指纹全变，diff 模糊轮救不回。
 */
export const contentSignature = (layer: SKLayer, withGeometry: boolean = true): string => {
    const style = layer.style;
    const contextSettings: any = style && style.contextSettings;
    // opacity 缺省 1，只在 <1 时进签名（下方 `if (opacity < 1)`），保历史指纹零漂移
    const opacity = contextSettings && typeof contextSettings.opacity === 'number' ? contextSettings.opacity : 1;
    const signature: any = {
        // t = 归一化后的 restoreType（rect/text/path/image/group/frame…），与 mapNode 同源
        t: restoreTypeOf(layer),
    };
    // —— 几何 ——
    // frame 保留 2 位小数——1) sub-pixel 抖动不改 hash；2) styleHash 分支跳过此块即得样式签名
    if (withGeometry) {
        signature.f = [
            round2(layer.frame ? layer.frame.x : 0),
            round2(layer.frame ? layer.frame.y : 0),
            round2(layer.frame ? layer.frame.width : 0),
            round2(layer.frame ? layer.frame.height : 0),
        ];
    }

    // —— 基础属性（缺省值绝不入签名，历史指纹零漂移的护栏）——
    if (layer.isVisible === false) signature.hide = true;
    if (layer.rotation) signature.r = round2(layer.rotation);
    if (opacity < 1) signature.o = round2(opacity);

    const flip = flipToRestore(layer);
    if (flip) signature.fl = flip;

    // —— 矢量变换 ——
    const windingRule = windingRuleToRestore(layer);
    if (windingRule) signature.wr = windingRule;

    const booleanOp = booleanOpToRestore(layer);
    if (booleanOp) signature.bop = booleanOp;

    // —— 画板背景（仅 hasBackgroundColor 开启时；Sketch 关闭旗标即视觉背景无效）——
    if (layer._class === 'artboard' && layer.hasBackgroundColor && layer.backgroundColor) {
        const bg = colorToHex(layer.backgroundColor);
        if (bg) signature.abg = bg;
    }

    // —— 布局 ——
    // resizingConstraint 位掩码 → 语义化约束对象，避免掩码整数直接进签名（可读性 + 归一化）
    const constraints = decodeConstraints(layer.resizingConstraint);
    if (constraints) signature.c = constraints;

    const stack = decodeStack(layer);
    if (stack) signature.st = stack;

    // —— 视觉样式（normalize 已过滤 !isEnabled，空数组不写）——
    const borderRadius = borderRadiusToRestore(layer);
    if (borderRadius) signature.br = borderRadius;

    const fills = fillsToRestore(layer);
    if (fills.length) signature.fi = fills;

    const borders = bordersToRestore(layer);
    if (borders.length) signature.bo = borders;

    const shadows = shadowsToRestore(style && style.shadows);
    if (shadows.length) signature.sh = shadows;

    const innerShadows = shadowsToRestore(style && style.innerShadows);
    if (innerShadows.length) signature.ish = innerShadows;

    const blur = blurToRestore(layer);
    if (blur) signature.bl = blur;

    // —— 文本（字符串本体 + 分段 runs 字体/字号/字重/颜色 + 自适应模式 + 垂直对齐）——
    if (layer._class === 'text' && layer.attributedString) {
        signature.tx = layer.attributedString.string;
        signature.runs = textRunsToRestore(layer);
        const resizing = textResizingToRestore((layer as any).textBehaviour);
        if (resizing) signature.tr = resizing;
        const verticalAlign = verticalAlignToRestore(layer);
        if (verticalAlign) signature.va = verticalAlign;
    }

    // —— 图片（优先原生 image._ref，其次插件端注入的 imageUrl 占位）——
    if (layer.image && layer.image._ref) signature.img = layer.image._ref;
    if (layer.imageUrl) signature.imgUrl = layer.imageUrl;

    // —— path 类：把矢量点列压成 SVG path 字符串——路径细节变化必反映到 hash ——
    if (restoreTypeOf(layer) === 'path') {
        const svgPath = pointsToSvgPath(layer);
        if (svgPath) signature.p = svgPath;
    }

    return JSON.stringify(signature);
};

/**
 * 免注入的 contentHash 只读计算——WeakMap 按对象身份缓存，避免同一 A 节点多次重算。
 *
 * 仅供 annotateStableIds 里 A/B 配对读取 A 侧指纹用：A 树**不属于**「文档化原地注入」
 * 的对象（原地注入只对 B 与 mastersC 生效）。往 A 写 hash 会污染调用方输入——若调用方
 * 复制 A 树派生新的 B（常见于测试/工具/复制画板场景），副本天生带 contentHash 会骗过
 * picassoArtboardRestoreParse 的幂等检测（`已存在 contentHash 就跳过重注入`），
 * 静默跳过整个 annotate 流程，导致下游拿到"半注入"结果。
 *
 * 注意：仅缓存含几何的 contentHash；styleHash 场景在 annotateHashes 里另行计算，
 * 因为其只在写侧用一次，缓存收益小。
 */
const contentHashCache = new WeakMap<object, string>();
export const contentHashOf = (layer: SKLayer): string => {
    const cached = contentHashCache.get(layer as any);
    if (cached) return cached;
    const hash = sha1(contentSignature(layer)).slice(0, 8);
    contentHashCache.set(layer as any, hash);
    return hash;
};

/**
 * 后序遍历为整棵树原地注入 contentHash / styleHash / subtreeHash。
 *
 * 调用契约：
 *  - **原地修改**入参对象（B 树或 master 树），返回值是根节点 subtreeHash（递归内部用）。
 *  - **幂等**：外层 picassoArtboardRestoreParse 会检测 `contentHash` 已存在则跳过重入，
 *    因此重复调用同一树无副作用；但此函数本体不做幂等判断，直接覆盖写。
 *  - **后序**：必须先递归子节点、再算自己的 subtreeHash（Merkle 依赖子哈希已就位）。
 *
 * 三个 hash 的写入时机：
 *  - contentHash：本节点自身归一化签名（含 frame），供精确配对轮 & diff 主键；
 *  - styleHash：本节点样式签名（不含 frame），供 diff「仅移动未改样式」判定；
 *  - subtreeHash：Merkle 汇总，供 diff 快速裁枝——`hash(contentHash + 有序子.subtreeHash)`
 *    保序拼接确保子序调换会改变 subtreeHash（配对时另有独立处理）。
 */
export const annotateHashes = (layer: SKLayer): string => {
    // 后序：先递归收集子 subtreeHash（有序），再算自己的三个 hash
    const childHashes: string[] = [];
    if (Array.isArray(layer.layers)) {
        layer.layers.forEach((child: SKLayer) => {
            childHashes.push(annotateHashes(child));
        });
    }
    const contentHash = sha1(contentSignature(layer)).slice(0, 8);
    // Merkle 拼接：contentHash 前置 + 子 subtreeHash 有序 join——子序调换必改根 subtreeHash
    const subtreeHash = sha1(contentHash + childHashes.join('')).slice(0, 8);
    (layer as any).contentHash = contentHash;
    // styleHash：同签名去 frame，与 contentHash 组两轮接力——不共享缓存（写侧一次性用）
    (layer as any).styleHash = sha1(contentSignature(layer, false)).slice(0, 8);
    (layer as any).subtreeHash = subtreeHash;
    return subtreeHash;
};
