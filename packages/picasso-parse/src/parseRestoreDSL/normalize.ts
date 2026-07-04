/**
 * Sketch 私有编码 → Web 通用值 的归一化纯函数集。
 * 全部为无副作用函数，供 mapNode（建树）与 contentSignature（哈希）共用，
 * 保证「节点输出」与「节点指纹」永远同源。
 */
import { SKLayer, SKColor, SKFrame } from '../types';
import {
    RestoreFill,
    RestoreBorder,
    RestoreShadow,
    RestoreGradient,
    RestoreConstraints,
    RestoreTextRun,
} from './restoreTypes';

export const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * 归一化结果缓存（按输入对象弱引用）。
 * 同一图层对象会被 contentSignature（注哈希）、mapNode（建树）、designTokens（聚合）
 * 各调一遍相同的纯函数——输入对象不变则结果不变，缓存避免整树多遍重复计算
 * （运行环境是 Sketch 的 JavaScriptCore，无原生 crypto，每画板解析延迟直接可感）。
 * 注意：缓存返回值被调用方共享持有（mapNode 直接引用、linkTokens 补写 token 字段），
 * 调用方不得原地增删缓存数组（建新数组用 concat），且「designTokens 聚合先于 linkTokens」不可倒置。
 */
const memoCache = new WeakMap<object, { [key: string]: any }>();
const memo = <T>(key: string, obj: any, compute: () => T): T => {
    if (!obj || typeof obj !== 'object') return compute();
    let entry = memoCache.get(obj);
    if (!entry) {
        entry = {};
        memoCache.set(obj, entry);
    }
    if (!(key in entry)) entry[key] = compute();
    return entry[key];
};

/**
 * designTokens 文本样式 key（token 登记与 linkTokens 查表必须同源，勿在调用方各自拼接：
 * `size || ''` 与 `size !== undefined` 对 size=0 会产生不同 key，导致 styleToken 静默丢失）
 */
export const textStyleKey = (run: { font?: string; size?: number; color?: string; lineHeight?: number }): string =>
    `${run.font || ''}|${run.size !== undefined ? run.size : ''}|${run.color || ''}|${run.lineHeight !== undefined ? run.lineHeight : ''}`;

const hexByte = (v: number): string => {
    const n = Math.max(0, Math.min(255, Math.round(v * 255)));
    return ('0' + n.toString(16)).slice(-2).toUpperCase();
};

/** SKColor(0~1 浮点) → #RRGGBB / #RRGGBBAA（alpha=1 时省略 AA 段） */
export const colorToHex = (color?: SKColor): string | undefined => {
    if (!color) return undefined;
    const base = `#${hexByte(color.red)}${hexByte(color.green)}${hexByte(color.blue)}`;
    if (typeof color.alpha === 'number' && color.alpha < 1) {
        return base + hexByte(color.alpha);
    }
    return base;
};

/** "{0.5, 0}" → [0.5, 0]，保留 2 位小数 */
export const parsePointString = (point?: string): number[] => {
    if (!point) return [0, 0];
    const m = String(point).match(/\{\s*([-\d.eE]+)\s*,\s*([-\d.eE]+)\s*\}/);
    if (!m) return [0, 0];
    return [round2(parseFloat(m[1])), round2(parseFloat(m[2]))];
};

const GRADIENT_TYPES = ['linear', 'radial', 'angular'];

export const gradientToRestore = (gradient: any): RestoreGradient | undefined => {
    if (!gradient || !Array.isArray(gradient.stops)) return undefined;
    return {
        type: (GRADIENT_TYPES[gradient.gradientType] || 'linear') as RestoreGradient['type'],
        from: parsePointString(gradient.from),
        to: parsePointString(gradient.to),
        stops: gradient.stops.map((stop: any) => ({
            color: colorToHex(stop.color) || '#000000',
            position: round2(stop.position),
        })),
    };
};

/**
 * resizingConstraint 位掩码 → 语义字段。
 * Sketch 存储的是「取反」掩码：位为 0 表示该约束启用，63 表示全自由。
 * 位序（取反后为 1 即启用）：1=right 2=fixedWidth 4=left 8=bottom 16=fixedHeight 32=top
 */
export const decodeConstraints = (resizingConstraint?: number): RestoreConstraints | undefined => {
    if (typeof resizingConstraint !== 'number') return undefined;
    const c = (resizingConstraint ^ 0xffffffff) & 63;
    if (c === 0) return undefined; // 全自由 = 缺省，省略
    return {
        pin: {
            left: !!(c & 4),
            right: !!(c & 1),
            top: !!(c & 32),
            bottom: !!(c & 8),
        },
        fixedWidth: !!(c & 2),
        fixedHeight: !!(c & 16),
    };
};

/** Sketch Smart Layout（groupLayout）→ stack.direction；未声明 / Freeform 时返回 undefined */
export const decodeStack = (layer: SKLayer): { direction: 'horizontal' | 'vertical' } | undefined => {
    const gl: any = layer.groupLayout;
    if (!gl || gl._class !== 'MSImmutableInferredGroupLayout') return undefined;
    // axis: 0=横排 1=竖排
    return { direction: gl.axis === 1 ? 'vertical' : 'horizontal' };
};

/** 图片填充模式 patternFillType → 语义值（缺省 fill） */
const PATTERN_FILL_MODES = ['tile', 'fill', 'stretch', 'fit'];

export const patternFillMode = (patternFillType?: number): string | undefined => {
    if (typeof patternFillType !== 'number') return undefined;
    return PATTERN_FILL_MODES[patternFillType] || 'fill';
};

/** fill 项级透明度并入颜色 alpha */
const applyFillOpacity = (color?: SKColor, contextSettings?: any): SKColor | undefined => {
    if (!color) return undefined;
    const opacity = contextSettings && typeof contextSettings.opacity === 'number' ? contextSettings.opacity : 1;
    if (opacity >= 1) return color;
    return { ...color, alpha: (typeof color.alpha === 'number' ? color.alpha : 1) * opacity };
};

export const fillsToRestore = (layer: SKLayer): RestoreFill[] => memo('fills', layer, () => {
    const fills = layer.style && layer.style.fills;
    if (!Array.isArray(fills)) return [];
    const result: RestoreFill[] = [];
    fills.forEach((fill: any) => {
        if (!fill || !fill.isEnabled) return;
        if (fill.fillType === 0) {
            const color = colorToHex(applyFillOpacity(fill.color, fill.contextSettings));
            if (color) result.push({ color });
        } else if (fill.fillType === 1) {
            const gradient = gradientToRestore(fill.gradient);
            if (gradient) result.push({ gradient });
        } else if (fill.fillType === 4) {
            const image: { url?: string; mode?: string } = {};
            if (fill.image && fill.image._ref) image.url = fill.image._ref;
            const mode = patternFillMode(fill.patternFillType);
            if (mode && mode !== 'fill') image.mode = mode;
            result.push({ image });
        }
    });
    return result;
});

const BORDER_POSITIONS = ['inside', 'center', 'outside'];

export const bordersToRestore = (layer: SKLayer): RestoreBorder[] => memo('borders', layer, () => {
    const borders = layer.style && layer.style.borders;
    if (!Array.isArray(borders)) return [];
    const borderOptions: any = layer.style && layer.style.borderOptions;
    // 0 长度段合法且有语义：[0, 8] + round lineCap 是圆点线，过滤掉 0 会把点线折叠成实虚线；
    // 只剔除负数/非数值脏值。全 0（无任何正值段）不构成可见图案，视为未设置
    const rawDash: number[] = borderOptions && Array.isArray(borderOptions.dashPattern)
        ? borderOptions.dashPattern.filter((v: any) => typeof v === 'number' && v >= 0)
        : [];
    const dashPattern: number[] = rawDash.some(v => v > 0) ? rawDash : [];
    const result: RestoreBorder[] = [];
    borders.forEach((border: any) => {
        if (!border || !border.isEnabled) return;
        const item: RestoreBorder = {
            thickness: round2(border.thickness),
            position: (BORDER_POSITIONS[border.position] || 'center') as RestoreBorder['position'],
        };
        if (border.fillType === 1) {
            const gradient = gradientToRestore(border.gradient);
            if (gradient) item.gradient = gradient;
        } else {
            const color = colorToHex(border.color);
            if (color) item.color = color;
        }
        if (dashPattern.length > 0) item.dash = dashPattern;
        result.push(item);
    });
    return result;
});

export const shadowsToRestore = (shadows?: any[]): RestoreShadow[] => memo('shadows', shadows, () => {
    if (!Array.isArray(shadows)) return [];
    const result: RestoreShadow[] = [];
    shadows.forEach((shadow: any) => {
        if (!shadow || !shadow.isEnabled) return;
        result.push({
            color: colorToHex(shadow.color) || '#000000',
            x: round2(shadow.offsetX),
            y: round2(shadow.offsetY),
            blur: round2(shadow.blurRadius),
            spread: round2(shadow.spread),
        });
    });
    return result;
});

const BLUR_TYPES = ['gaussian', 'motion', 'zoom', 'background'];

export const blurToRestore = (layer: SKLayer): { type: string; radius: number } | undefined => memo('blur', layer, () => {
    const blur: any = layer.style && layer.style.blur;
    if (!blur || !blur.isEnabled) return undefined;
    return {
        type: BLUR_TYPES[blur.type] || 'gaussian',
        radius: round2(blur.radius),
    };
});

/** 四角圆角：fixedRadius / points 圆角统一到 [tl, tr, br, bl]；全 0 返回 undefined */
export const borderRadiusToRestore = (layer: SKLayer): number[] | undefined => memo('borderRadius', layer, () => {
    const points: any[] = Array.isArray(layer.points) ? layer.points : [];
    let radius: number[] | undefined;
    if (points.length === 4 && layer._class === 'rectangle') {
        // rectangle 的 points 顺序为 tl → tr → br → bl
        radius = points.map((p: any) => round2(p.cornerRadius || 0));
    } else if (typeof layer.fixedRadius === 'number' && layer.fixedRadius > 0) {
        const r = round2(layer.fixedRadius);
        radius = [r, r, r, r];
    }
    if (!radius || radius.every(r => r === 0)) return undefined;
    return radius;
});

/** PostScript 字体名拆 fontFamily / fontWeight / italic */
const FONT_FAMILY_MAP: { [key: string]: string } = {
    PingFangSC: 'PingFang SC',
    PingFangTC: 'PingFang TC',
    PingFangHK: 'PingFang HK',
    HelveticaNeue: 'Helvetica Neue',
    SFProText: 'SF Pro Text',
    SFProDisplay: 'SF Pro Display',
    SFUIText: 'SF UI Text',
    SFUIDisplay: 'SF UI Display',
    DINAlternate: 'DIN Alternate',
    DINCondensed: 'DIN Condensed',
    ArialMT: 'Arial',
    MicrosoftYaHei: 'Microsoft YaHei',
    HiraginoSansGB: 'Hiragino Sans GB',
};

export const fontWeightFromName = (psName: string): number => {
    if (/black|heavy/i.test(psName)) return 900;
    if (/ultrabold|extrabold/i.test(psName)) return 800;
    if (/bold/i.test(psName)) return 700;
    if (/semibold|demibold/i.test(psName)) return 600;
    if (/medium/i.test(psName)) return 500;
    if (/extralight|ultralight/i.test(psName)) return 200;
    if (/thin/i.test(psName)) return 100;
    if (/light/i.test(psName)) return 300;
    return 400;
};

export const fontInfoFromPostScriptName = (psName?: string): { font?: string; fontFamily?: string; fontWeight: number; italic: boolean } => {
    if (!psName) return { fontWeight: 400, italic: false };
    const base = psName.split('-')[0];
    return {
        font: psName,
        fontFamily: FONT_FAMILY_MAP[base] || base,
        fontWeight: fontWeightFromName(psName),
        italic: /italic|oblique/i.test(psName),
    };
};

const TEXT_ALIGNS = ['left', 'right', 'center', 'justify'];
const TEXT_RESIZINGS = ['auto-width', 'auto-height', 'fixed'];
const VERTICAL_ALIGNS = ['top', 'middle', 'bottom'];

export const textResizingToRestore = (textBehaviour?: number): string | undefined => {
    if (typeof textBehaviour !== 'number') return undefined;
    return TEXT_RESIZINGS[textBehaviour];
};

export const verticalAlignToRestore = (layer: SKLayer): string | undefined => {
    const textStyle: any = layer.style && (layer.style as any).textStyle;
    const v = textStyle && typeof textStyle.verticalAlignment === 'number' ? textStyle.verticalAlignment : 0;
    if (v === 0) return undefined; // 缺省 top 省略
    return VERTICAL_ALIGNS[v];
};

/** attributedString → text runs（富文本归一化）。
 * 分段信息缺失时从图层级 textStyle 合成整段单 run 兜底——
 * 消费方按「text 节点必有 runs」消费，缺 runs 时字体/颜色/字号全丢。 */
export const textRunsToRestore = (layer: SKLayer): RestoreTextRun[] => memo('textRuns', layer, () => {
    const attributed = layer.attributedString;
    if (!attributed) return [];
    let attrList: any[] = Array.isArray(attributed.attributes) ? attributed.attributes : [];
    if (!attrList.length) {
        const textStyle: any = layer.style && (layer.style as any).textStyle;
        attrList = [{
            location: 0,
            length: (attributed.string || '').length,
            attributes: (textStyle && textStyle.encodedAttributes) || {},
        }];
    }
    return attrList.map((run: any) => {
        const attrs = run.attributes || {};
        const fontAttr = attrs.MSAttributedStringFontAttribute && attrs.MSAttributedStringFontAttribute.attributes;
        const fontInfo = fontInfoFromPostScriptName(fontAttr && fontAttr.name);
        const item: RestoreTextRun = {
            from: run.location,
            len: run.length,
        };
        if (fontInfo.font) item.font = fontInfo.font;
        if (fontInfo.fontFamily) item.fontFamily = fontInfo.fontFamily;
        item.fontWeight = fontInfo.fontWeight;
        if (fontInfo.italic) item.italic = true;
        if (fontAttr && typeof fontAttr.size === 'number') item.size = round2(fontAttr.size);
        const color = colorToHex(attrs.MSAttributedStringColorAttribute);
        if (color) item.color = color;
        const paragraph = attrs.paragraphStyle;
        if (paragraph && typeof paragraph.maximumLineHeight === 'number' && paragraph.maximumLineHeight > 0) {
            item.lineHeight = round2(paragraph.maximumLineHeight);
        }
        if (typeof attrs.kerning === 'number' && attrs.kerning !== 0) {
            item.letterSpacing = round2(attrs.kerning);
        }
        if (paragraph && typeof paragraph.alignment === 'number' && paragraph.alignment !== 0) {
            const align = TEXT_ALIGNS[paragraph.alignment];
            if (align) item.align = align;
        }
        if (attrs.underlineStyle) {
            item.decoration = 'underline';
        } else if (attrs.strikethroughStyle) {
            item.decoration = 'line-through';
        }
        return item;
    });
});

/**
 * 矢量描点 → SVG path。
 * points 内坐标为 0~1 归一化值（字符串 "{x, y}"），按图层 frame 尺寸展开；
 * curveMode 非直线时用三次贝塞尔（curveFrom/curveTo 控制点）。
 */
export const pointsToSvgPath = (layer: SKLayer): string | undefined => memo('svgPath', layer, () => {
    const points: any[] = Array.isArray(layer.points) ? layer.points : [];
    if (points.length < 2) return undefined;
    const frame: SKFrame = layer.frame || ({ width: 0, height: 0 } as SKFrame);
    // formatCoordinate 处理后 frame.width 为缩放后实际尺寸，直接使用
    const w = frame.width || 0;
    const h = frame.height || 0;
    const scale = (p?: string): number[] => {
        const [x, y] = parsePointString(p);
        return [round2(x * w), round2(y * h)];
    };

    let d = '';
    const first = scale(points[0].point);
    d += `M${first[0]} ${first[1]}`;
    for (let i = 0; i < points.length; i++) {
        const curr = points[i];
        const next = points[(i + 1) % points.length];
        const isLast = i === points.length - 1;
        if (isLast && !layer.isClosed) break;
        const from = scale(curr.curveFrom || curr.point);
        const to = scale(next.curveTo || next.point);
        const end = scale(next.point);
        const currPoint = scale(curr.point);
        const straight = from[0] === currPoint[0] && from[1] === currPoint[1] && to[0] === end[0] && to[1] === end[1];
        if (straight) {
            d += `L${end[0]} ${end[1]}`;
        } else {
            d += `C${from[0]} ${from[1]} ${to[0]} ${to[1]} ${end[0]} ${end[1]}`;
        }
    }
    if (layer.isClosed) d += 'Z';
    return d;
});

/** 翻转：仅有翻转时输出 { x?: true, y?: true } */
export const flipToRestore = (layer: SKLayer): { x?: boolean; y?: boolean } | undefined => {
    const flip: { x?: boolean; y?: boolean } = {};
    if (layer.isFlippedHorizontal) flip.x = true;
    if (layer.isFlippedVertical) flip.y = true;
    return flip.x || flip.y ? flip : undefined;
};

/** svgPath 填充规则：Sketch style.windingRule 0=nonzero / 1=evenodd；缺省 evenodd 省略 */
export const windingRuleToRestore = (layer: SKLayer): string | undefined => {
    const style: any = layer.style;
    if (style && style.windingRule === 0) return 'nonzero';
    return undefined;
};

/** 布尔运算符：-1 无运算不输出；0~3 → union/subtract/intersect/difference */
const BOOLEAN_OPS = ['union', 'subtract', 'intersect', 'difference'];

export const booleanOpToRestore = (layer: SKLayer): string | undefined => {
    const op = layer.booleanOperation;
    if (typeof op !== 'number' || op < 0 || op > 3) return undefined;
    return BOOLEAN_OPS[op];
};

/**
 * Sketch 2025 的 Frame / GraphicFrame 容器：导出 JSON 的 _class 仍是 'group'，
 * 靠 groupBehavior 区分（0 Default / 1 Frame / 2 Graphic）。与普通编组的关键差异：
 * Frame 可带真实背景填充/圆角/裁剪——其 style.fills 是要渲染的背景，
 * 不是普通编组那种「子图标着色（tint）提示」。
 */
export const isFrameContainer = (layer: SKLayer): boolean =>
    layer._class === 'group' && (layer.groupBehavior === 1 || layer.groupBehavior === 2);

/** _class → RestoreDSL type 映射 */
export const restoreTypeOf = (layer: SKLayer): string => {
    switch (layer._class) {
        case 'artboard':
            return 'artboard';
        case 'group':
        case 'symbolMaster':
        case 'symbolInstance':
            return 'group';
        case 'rectangle':
            return 'rect';
        case 'oval':
            return 'oval';
        case 'text':
            return 'text';
        case 'slice':
            return 'slice';
        case 'bitmap':
        case 'image':
            return 'image';
        case 'shapeGroup':
            return 'group';
        default:
            // shapePath / triangle / star / polygon 及其余矢量类
            return 'path';
    }
};
