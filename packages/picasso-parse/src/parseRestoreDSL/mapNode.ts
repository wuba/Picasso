/**
 * 预处理后的 Sketch 图层树 → RestoreDSL 节点树（1:1 镜像，字段裁剪 + 值归一化 + 缺省省略）。
 * 输入树已经过：坐标绝对化（formatCoordinate + fixPosition）、Mask 几何化（trimByMask）、
 * 隐藏层剔除（filterHideLayer），frame 均为画板绝对坐标。
 */
import { SKLayer } from '../types';
import sha1 from './sha1';
import { RestoreNode, RestoreFrame } from './restoreTypes';
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

const mapNode = (layer: SKLayer, parentAbs: { x: number; y: number } | null): RestoreNode => {
    const abs: RestoreFrame = {
        x: round2(layer.frame.x),
        y: round2(layer.frame.y),
        w: round2(layer.frame.width),
        h: round2(layer.frame.height),
    };
    const rel: RestoreFrame = parentAbs
        ? { x: round2(abs.x - parentAbs.x), y: round2(abs.y - parentAbs.y), w: abs.w, h: abs.h }
        : { x: 0, y: 0, w: abs.w, h: abs.h };

    const type = restoreTypeOf(layer);
    const node: RestoreNode = {
        id: (layer as any).stableId || sha1(layer.do_objectID || '').slice(0, 8),
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
    const fills = fillsToRestore(layer);
    // 画板背景色（Sketch 存在 backgroundColor 字段而非 style.fills，丢了整页底色就全白）
    if (type === 'artboard' && layer.hasBackgroundColor && layer.backgroundColor) {
        const bg = colorToHex(layer.backgroundColor);
        if (bg) fills.unshift({ color: bg });
    }
    if (fills.length) node.fills = fills;
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
    if ((layer as any).subtreeHash) node.subtreeHash = (layer as any).subtreeHash;

    if (type !== 'text' && Array.isArray(layer.layers) && layer.layers.length > 0) {
        node.children = layer.layers.map((child: SKLayer) => mapNode(child, { x: abs.x, y: abs.y }));
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
