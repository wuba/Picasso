/**
 * 预处理后的 Sketch 图层树 → RestoreDSL 节点树（1:1 镜像，字段裁剪 + 值归一化 + 缺省省略）。
 * 输入树已经过：坐标绝对化（formatCoordinate + fixPosition）、Mask 几何化（trimByMask）、
 * 隐藏层剔除（filterHideLayer），frame 均为画板绝对坐标。
 */
import { SKLayer } from '../types';
import sha1 from './sha1';
import { RestoreNode, RestoreFrame, RestoreFill } from './restoreTypes';
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
    isFrameContainer,
} from './normalize';

/** stack.spacing：子节点间距一致（±0.5pt）时才写，几何推不稳时只留 direction */
const uniformSpacing = (children: RestoreNode[], direction: 'horizontal' | 'vertical'): number | undefined => {
    if (children.length < 2) return undefined;
    const sorted = children
        .slice()
        .sort((a, b) => (direction === 'vertical' ? a.absFrame.y - b.absFrame.y : a.absFrame.x - b.absFrame.x));
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1].absFrame;
        const curr = sorted[i].absFrame;
        gaps.push(direction === 'vertical' ? curr.y - (prev.y + prev.h) : curr.x - (prev.x + prev.w));
    }
    const first = gaps[0];
    if (first < 0) return undefined;
    if (gaps.every(g => Math.abs(g - first) <= 0.5)) return round2(first);
    return undefined;
};

/**
 * 无 stableId（exportA 缺省 / 配对失败降级）时的兜底 id：B 侧 do_objectID 短哈希。
 * 与 shortHashOf 同策略做树内查重：碰撞先延长 12 位，仍冲突（仅 do_objectID 缺失/重复时可能）追加序号，
 * 保证单棵 RestoreDSL 树内 id 唯一——消费方普遍按 id 建索引，重复 id 会静默覆盖丢节点。
 */
const fallbackNodeId = (layer: SKLayer, usedIds: { [id: string]: boolean }): string => {
    const full = sha1(layer.do_objectID || '');
    let id = full.slice(0, 8);
    if (usedIds[id]) id = full.slice(0, 12);
    let candidate = id;
    let n = 2;
    while (usedIds[candidate]) candidate = `${id}-${n++}`;
    return candidate;
};

const mapNode = (layer: SKLayer, parentAbs: { x: number; y: number } | null, usedIds?: { [id: string]: boolean }): RestoreNode => {
    const used = usedIds || {};
    const abs: RestoreFrame = {
        x: round2(layer.frame.x),
        y: round2(layer.frame.y),
        w: round2(layer.frame.width),
        h: round2(layer.frame.height),
    };
    const rel: RestoreFrame = parentAbs
        ? { x: round2(abs.x - parentAbs.x), y: round2(abs.y - parentAbs.y), w: abs.w, h: abs.h }
        : { x: 0, y: 0, w: abs.w, h: abs.h };

    // Sketch 2025 起画板默认是 Frame（_class 'group' + groupBehavior 1/2），老 Artboard 逐渐消失。
    // Frame 作为解析根时语义就是画板，type 归为 'artboard'——否则消费方按普通 group 处理，
    // 画板级约定（背景渲染、缺省白底、整图挂载）全部失配。仅根节点归类，嵌套 Frame 仍是 group；
    // 只改 mapNode 输出不动 restoreTypeOf，contentHash/styleHash（经 contentSignature）不受影响。
    const frameContainer = isFrameContainer(layer);
    const isRoot = parentAbs === null;
    let type = restoreTypeOf(layer);
    if (isRoot && frameContainer) type = 'artboard';
    const id: string = (layer as any).stableId || fallbackNodeId(layer, used);
    used[id] = true;
    const node: RestoreNode = {
        id,
        type,
        name: layer.name,
        frame: rel,
        absFrame: abs,
    };

    // —— 缺省值省略：仅偏离缺省时落 key ——
    if (layer.isVisible === false) node.visible = false;
    if (layer.rotation) node.rotation = round2(layer.rotation);
    const contextSettings: any = layer.style && layer.style.contextSettings;
    if (contextSettings && typeof contextSettings.opacity === 'number' && contextSettings.opacity < 1) {
        node.opacity = round2(contextSettings.opacity);
    }
    const constraints = decodeConstraints(layer.resizingConstraint);
    if (constraints) node.constraints = constraints;
    const flip = flipToRestore(layer);
    if (flip) node.flip = flip;
    const booleanOp = booleanOpToRestore(layer);
    if (booleanOp) node.booleanOperation = booleanOp;

    const borderRadius = borderRadiusToRestore(layer);
    if (borderRadius) node.borderRadius = borderRadius;
    let fills = fillsToRestore(layer);
    // 画板背景色（Sketch 存在 backgroundColor 字段而非 style.fills，丢了整页底色就全白）。
    // 解析根不限 _class：老 Artboard 之外，symbolMaster 等作根导出时同样带 backgroundColor
    if ((type === 'artboard' || isRoot) && layer.hasBackgroundColor && layer.backgroundColor) {
        const bg = colorToHex(layer.backgroundColor);
        // concat 建新数组：fillsToRestore 返回值有缓存（normalize.ts memo），禁止原地 unshift
        if (bg) fills = ([{ color: bg }] as RestoreFill[]).concat(fills);
    }
    if (fills.length) {
        // Sketch 的普通编组没有背景填充语义——组上的 fills 是「子图标着色（tint）」，
        // 渲染成背景会出现色块（例：展开箭头组的 #999999 灰方块）。
        // 三类例外的 fills 是要渲染的真实填充，保持 fills 语义：
        // - shapeGroup（布尔运算形状）；
        // - Frame / GraphicFrame 容器（含嵌套）：Frame 的填充就是背景，误归 tint 会丢整块底色；
        // - 解析根：根容器（画板/Frame/symbolMaster）的填充是页面底色。
        // 其余类型（rect/oval/path/text/artboard…）维持 fills 原语义。
        if (type === 'group' && layer._class !== 'shapeGroup' && !frameContainer && !isRoot) {
            node.tint = fills;
        } else {
            node.fills = fills;
        }
    }
    if (layer._class === 'shapeGroup') node.shapeGroup = true;
    const borders = bordersToRestore(layer);
    if (borders.length) node.borders = borders;
    const shadows = shadowsToRestore(layer.style && layer.style.shadows);
    if (shadows.length) node.shadows = shadows;
    const innerShadows = shadowsToRestore(layer.style && layer.style.innerShadows);
    if (innerShadows.length) node.innerShadows = innerShadows;
    const blur = blurToRestore(layer);
    if (blur) node.blur = blur;

    // 矢量节点（未被切图处理的）保留 path；描点缺失时按 frame 兜底矩形路径（path 节点必有 svgPath）
    if (type === 'path') {
        node.svgPath = pointsToSvgPath(layer) || `M0 0L${rel.w} 0L${rel.w} ${rel.h}L0 ${rel.h}Z`;
        const windingRule = windingRuleToRestore(layer);
        if (windingRule) node.windingRule = windingRule;
    }

    // 文本节点
    if (type === 'text' && layer.attributedString) {
        node.text = layer.attributedString.string;
        const resizing = textResizingToRestore((layer as any).textBehaviour);
        if (resizing) node.textResizing = resizing;
        const verticalAlign = verticalAlignToRestore(layer);
        if (verticalAlign) node.verticalAlign = verticalAlign;
        const runs = textRunsToRestore(layer);
        if (runs.length) {
            node.runs = runs;
            // 节点级段落对齐上提：全段一致时消费方免扫 runs（left 为缺省省略）
            const firstAlign = runs[0].align || 'left';
            if (firstAlign !== 'left' && runs.every(run => (run.align || 'left') === firstAlign)) {
                node.align = firstAlign;
            }
            // 行高兜底：设计师未显式设置行高时 runs 无 lineHeight，而 Sketch 实际按
            // CoreText 字体默认行高渲染，消费方（尤其 LLM）拿不到该值只能猜（1.2/1.5 倍必错）。
            // 单行自适应文本的 frame 高度就是 Sketch 实算行高（PingFang 实测 28→40、32→45、24→33），
            // 直接采信；多行用 1.4 倍近似（PingFang 系实测区间 1.375~1.44 的中值）。
            // 不回写 runs：runs 参与 contentHash 与 styleToken 关联（textStyleKey），改了会双双破坏。
            const firstRun = runs[0];
            if (firstRun.lineHeight === undefined && typeof firstRun.size === 'number'
                && node.textResizing !== 'fixed') {
                node.effectiveLineHeight = rel.h <= firstRun.size * 1.9
                    ? rel.h
                    : Math.round(firstRun.size * 1.4);
            }
        }
    }

    // 图片节点（bitmap 原生图 / 被切图整形的占位节点）
    if (type === 'image') {
        const image: { url?: string; w?: number; h?: number; mode?: string } = {};
        if (layer.imageUrl) {
            image.url = layer.imageUrl;
        } else if (layer.image && layer.image._ref) {
            image.url = layer.image._ref;
        }
        node.image = image;
    }

    // Symbol 实例（componentKey 对应顶层 components 字典；children 即引擎展开树）
    if ((layer as any).restoreComponentKey) node.componentKey = (layer as any).restoreComponentKey;
    if ((layer as any).restoreOverrides) node.overrides = (layer as any).restoreOverrides;

    // diff 支撑
    if ((layer as any).contentHash) node.contentHash = (layer as any).contentHash;
    if ((layer as any).styleHash) node.styleHash = (layer as any).styleHash;
    if ((layer as any).subtreeHash) node.subtreeHash = (layer as any).subtreeHash;

    if (type !== 'text' && Array.isArray(layer.layers) && layer.layers.length > 0) {
        node.children = layer.layers.map((child: SKLayer) => mapNode(child, { x: abs.x, y: abs.y }, used));
    }

    // Smart Layout 透传（spacing 依赖已映射子节点的几何，最后算）
    const stack = decodeStack(layer);
    if (stack) {
        node.stack = stack;
        if (node.children && node.children.length > 1) {
            const spacing = uniformSpacing(node.children, stack.direction);
            if (spacing !== undefined) node.stack.spacing = spacing;
        }
    }

    return node;
};

export default mapNode;
