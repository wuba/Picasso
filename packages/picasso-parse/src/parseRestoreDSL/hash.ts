/**
 * 稳定 ID（UUID 短哈希）与内容指纹（contentHash / subtreeHash）。
 *
 * - shortHash：对 UUID 做 sha1 取前 8 位十六进制；全画板查重，碰撞时该节点延长至 12 位。
 * - contentHash：节点归一化属性哈希（不含 children / name / 绝对坐标 / id）——内容寻址，
 *   供跨版本 diff 的模糊配对轮使用，name 是独立打分信号故不入指纹。
 * - subtreeHash：Merkle 结构 hash(contentHash + 有序 children.subtreeHash)。
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

export type ShortHashContext = {
    // 短哈希 → 已占用该短哈希的 UUID（碰撞检测）
    used: { [short: string]: string };
    // UUID → 已分配短哈希（同一 UUID 永远同值）
    assigned: { [uuid: string]: string };
};

export const createShortHashContext = (): ShortHashContext => ({ used: {}, assigned: {} });

export const shortHashOf = (uuid: string, ctx: ShortHashContext): string => {
    if (ctx.assigned[uuid]) return ctx.assigned[uuid];
    const full = sha1(uuid);
    let short = full.slice(0, 8);
    if (ctx.used[short] && ctx.used[short] !== uuid) {
        // 碰撞兜底（概率可忽略但必须处理）：延长至 12 位
        short = full.slice(0, 12);
    }
    ctx.used[short] = uuid;
    ctx.assigned[uuid] = short;
    return short;
};

/**
 * 节点内容签名：与 mapNode 输出同源的归一化属性，固定 key 顺序保证序列化确定性。
 * 不含 name（模糊配对独立信号）、不含绝对坐标（父级移动不改子指纹）、不含 children。
 */
export const contentSignature = (layer: SKLayer): string => {
    const style = layer.style;
    const contextSettings: any = style && style.contextSettings;
    const opacity = contextSettings && typeof contextSettings.opacity === 'number' ? contextSettings.opacity : 1;
    const signature: any = {
        t: restoreTypeOf(layer),
        f: [round2(layer.frame ? layer.frame.x : 0), round2(layer.frame ? layer.frame.y : 0), round2(layer.frame ? layer.frame.width : 0), round2(layer.frame ? layer.frame.height : 0)],
    };
    if (layer.isVisible === false) signature.hide = true;
    if (layer.rotation) signature.r = round2(layer.rotation);
    if (opacity < 1) signature.o = round2(opacity);
    const flip = flipToRestore(layer);
    if (flip) signature.fl = flip;
    const windingRule = windingRuleToRestore(layer);
    if (windingRule) signature.wr = windingRule;
    const booleanOp = booleanOpToRestore(layer);
    if (booleanOp) signature.bop = booleanOp;
    if (layer._class === 'artboard' && layer.hasBackgroundColor && layer.backgroundColor) {
        const bg = colorToHex(layer.backgroundColor);
        if (bg) signature.abg = bg;
    }
    const constraints = decodeConstraints(layer.resizingConstraint);
    if (constraints) signature.c = constraints;
    const stack = decodeStack(layer);
    if (stack) signature.st = stack;
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
    if (layer._class === 'text' && layer.attributedString) {
        signature.tx = layer.attributedString.string;
        signature.runs = textRunsToRestore(layer);
        const resizing = textResizingToRestore((layer as any).textBehaviour);
        if (resizing) signature.tr = resizing;
        const verticalAlign = verticalAlignToRestore(layer);
        if (verticalAlign) signature.va = verticalAlign;
    }
    if (layer.image && layer.image._ref) signature.img = layer.image._ref;
    if (layer.imageUrl) signature.imgUrl = layer.imageUrl;
    if (restoreTypeOf(layer) === 'path') {
        const svgPath = pointsToSvgPath(layer);
        if (svgPath) signature.p = svgPath;
    }
    return JSON.stringify(signature);
};

/**
 * 后序遍历为整棵树注入 contentHash / subtreeHash（原地修改，幂等）。
 */
export const annotateHashes = (layer: SKLayer): string => {
    const childHashes: string[] = [];
    if (Array.isArray(layer.layers)) {
        layer.layers.forEach((child: SKLayer) => {
            childHashes.push(annotateHashes(child));
        });
    }
    const contentHash = sha1(contentSignature(layer)).slice(0, 8);
    const subtreeHash = sha1(contentHash + childHashes.join('')).slice(0, 8);
    (layer as any).contentHash = contentHash;
    (layer as any).subtreeHash = subtreeHash;
    return subtreeHash;
};
