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

/** 保留 2 位小数——所有几何/颜色计算的标准精度：sub-pixel 抖动（如 0.0001）不改指纹 */
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

/**
 * 单通道 0~1 浮点 → 2 位十六进制大写字符串。
 * clamp 到 [0,255]：Sketch 极少出现越界值，但脏输入（导出损坏/手工编辑）不能让 hex 产出负号或 3 位。
 * `'0' + ...slice(-2)`：n<16 时补前导 0，避免 hex('f') 只有 1 位破坏 #rrggbb 格式。
 */
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

// Sketch gradientType 数值 → 语义值：0/1/2 分别对应线性/径向/角度渐变
const GRADIENT_TYPES = ['linear', 'radial', 'angular'];

/**
 * Sketch 渐变结构 → RestoreGradient。
 * stops 必存在（无 stop 不构成渐变，直接 undefined）；缺失 gradientType 时降级为 linear——
 * 这是 Sketch 早期版本导出兼容路径，新版必给数值。
 * stop.color 兜底 '#000000'：单个 stop 颜色异常不能让整条渐变归零（消费方会误判为纯背景无渐变）。
 */
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

// 图片填充模式 patternFillType 数值 → 语义值：0/1/2/3 分别对应平铺/填满/拉伸/贴合
const PATTERN_FILL_MODES = ['tile', 'fill', 'stretch', 'fit'];

/** patternFillType 数值 → 语义模式；未知数值降级为 fill（Sketch 默认表现） */
export const patternFillMode = (patternFillType?: number): string | undefined => {
    if (typeof patternFillType !== 'number') return undefined;
    return PATTERN_FILL_MODES[patternFillType] || 'fill';
};

/**
 * fill 项级透明度并入颜色 alpha 通道。
 * Sketch 允许每个 fill 层独立设 contextSettings.opacity，若不并入 alpha，
 * 消费方需两遍相乘计算（layer.opacity × fill.opacity × color.alpha），易漏；
 * 合并后 hex 一次即含所有信息，也让 contentHash 稳定（同视觉两种存储 → 同 hash）。
 */
const applyFillOpacity = (color?: SKColor, contextSettings?: any): SKColor | undefined => {
    if (!color) return undefined;
    const opacity = contextSettings && typeof contextSettings.opacity === 'number' ? contextSettings.opacity : 1;
    if (opacity >= 1) return color;
    return { ...color, alpha: (typeof color.alpha === 'number' ? color.alpha : 1) * opacity };
};

/**
 * 图层 fills 数组归一化。
 * fillType 数值：0=纯色 / 1=渐变 / 4=图片；2/3（Pattern、Noise）Sketch 内极少用，暂不支持——
 * 遇到时静默丢弃（结果数组不含该项），不当异常抛出以免中断整树解析。
 * !isEnabled 的填充直接跳过（消费方约定：能进入 fills 的都是启用态）。
 */
export const fillsToRestore = (layer: SKLayer): RestoreFill[] => memo('fills', layer, () => {
    const fills = layer.style && layer.style.fills;
    if (!Array.isArray(fills)) return [];
    const result: RestoreFill[] = [];
    fills.forEach((fill: any) => {
        if (!fill || !fill.isEnabled) return;
        if (fill.fillType === 0) {
            // 纯色：项级透明度先并入 alpha，再 hex 化
            const color = colorToHex(applyFillOpacity(fill.color, fill.contextSettings));
            if (color) result.push({ color });
        } else if (fill.fillType === 1) {
            // 渐变：项级 opacity 未并入（渐变每个 stop 各自有 alpha，整体缩放需消费方处理）
            const gradient = gradientToRestore(fill.gradient);
            if (gradient) result.push({ gradient });
        } else if (fill.fillType === 4) {
            // 图片：仅在非 fill 缺省模式时才写 mode，节省体积
            const image: { url?: string; mode?: string } = {};
            if (fill.image && fill.image._ref) image.url = fill.image._ref;
            const mode = patternFillMode(fill.patternFillType);
            if (mode && mode !== 'fill') image.mode = mode;
            result.push({ image });
        }
    });
    return result;
});

// Sketch borderPosition 数值 → 语义值：0=内描 / 1=居中 / 2=外描
const BORDER_POSITIONS = ['inside', 'center', 'outside'];

/**
 * 图层 borders 数组归一化。
 * dashPattern 是**图层级**（所有 border 共享同一 dash），非 border 级——挂到每条 border 上是为
 * 消费方便利。fillType 1 = 渐变描边，其他值当纯色描边处理（Sketch 描边 fillType 语义与 fill 一致）。
 */
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
            // 未知 position 数值降级为 center（Sketch 默认表现）
            position: (BORDER_POSITIONS[border.position] || 'center') as RestoreBorder['position'],
        };
        if (border.fillType === 1) {
            const gradient = gradientToRestore(border.gradient);
            if (gradient) item.gradient = gradient;
        } else {
            // fillType 0（纯色）或其他值都当纯色处理——描边极少有 pattern/image 类型
            const color = colorToHex(border.color);
            if (color) item.color = color;
        }
        if (dashPattern.length > 0) item.dash = dashPattern;
        result.push(item);
    });
    return result;
});

/**
 * 阴影数组归一化——同时给外阴影（shadows）与内阴影（innerShadows）用，
 * 因此入参不是 layer 而是 shadows 数组。
 * color 兜底 '#000000'：Sketch 默认阴影就是黑，脏输入下不能让阴影结构合法而颜色为 undefined。
 * offsetX/Y/blur/spread 语义与 CSS box-shadow 一致，消费方可直接映射。
 */
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

// Sketch blur.type 数值 → 语义值：0/1/2/3 分别对应高斯/动感/缩放/背景模糊
const BLUR_TYPES = ['gaussian', 'motion', 'zoom', 'background'];

/**
 * 图层模糊效果归一化。
 * 与其他 style 字段一致，未启用（!isEnabled）返回 undefined 不落 key。
 * 未知 type 数值降级为 gaussian（最常见）。
 */
export const blurToRestore = (layer: SKLayer): { type: string; radius: number } | undefined => memo('blur', layer, () => {
    const blur: any = layer.style && layer.style.blur;
    if (!blur || !blur.isEnabled) return undefined;
    return {
        type: BLUR_TYPES[blur.type] || 'gaussian',
        radius: round2(blur.radius),
    };
});

/**
 * 四角圆角：fixedRadius / points 圆角统一到 [tl, tr, br, bl]；全 0 返回 undefined。
 *
 * 只信任 4 点 rectangle 的 points.cornerRadius——因为：
 *   1) Sketch 里"四角独立设置"的能力只对 rectangle 类矢量层暴露；
 *   2) 其它 shape（oval / triangle / polygon / star / path）的 points 数量按几何顶点走
 *      （oval=4 但语义是椭圆控制点非四角，triangle=3，polygon/star=n），点上的 cornerRadius
 *      表达的是"顶点倒角"而非"矩形四角"，直接当矩形圆角读会得到语义错乱的数组。
 * 非 4 点 rectangle 或非 rectangle 类的圆角一律走 fixedRadius 单值兜底（四角同值）。
 */
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

/**
 * PostScript 字体名 → CSS fontWeight 数值。
 *
 * 匹配顺序不可随意换：
 *   1) black / heavy 900 优先——某些字体命名 `HeavyBold`，先 heavy 判 900 更准；
 *   2) ultra/extra bold 800 必须在 bold 前——否则 `UltraBold` 会被 bold 抢去落 700；
 *   3) semi/demi bold 600 同样必须在 bold 后但独立判——名字含 bold 的都得先绕过 bold 分支；
 *   4) light 300 放最后——`ExtraLight` / `UltraLight` 已在前面被 200 拦住，
 *      否则 `UltraLight` 会先命中 light 落 300。
 * 未命中一律 400（Regular / Normal）。
 */
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

/**
 * PostScript 字体名（如 `PingFangSC-Medium`）→ 四元组 { font, fontFamily, fontWeight, italic }。
 *
 * PostScript 命名约定：`<Family>-<Style>`（连字符分隔家族与风格）。取 split('-')[0] 作 family
 * base，再用 FONT_FAMILY_MAP 补空格版本（`PingFangSC` → `PingFang SC`，方便 CSS/RN 直接用）；
 * 映射表未命中时保留 base 原样（新字体不需要提前登记即可正常输出，只是缺"漂亮空格"）。
 * fontWeight / italic 从整段 psName 字符串识别，不依赖 style 段分割（防 `PingFangSC-Bold-Italic`
 * 这类多段命名漏解析）。
 */
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

// 段落对齐 alignment 数值 → 语义值：0/1/2/3 分别对应 left / right / center / justify
const TEXT_ALIGNS = ['left', 'right', 'center', 'justify'];
// 文本框 textBehaviour 数值 → 语义值：0 宽随内容 / 1 高随内容 / 2 固定框
const TEXT_RESIZINGS = ['auto-width', 'auto-height', 'fixed'];
// 垂直对齐 verticalAlignment 数值 → 语义值：0/1/2 分别对应 top / middle / bottom
const VERTICAL_ALIGNS = ['top', 'middle', 'bottom'];

/** textBehaviour → 语义模式；未传（缺省 auto-width）返回 undefined 不落 key */
export const textResizingToRestore = (textBehaviour?: number): string | undefined => {
    if (typeof textBehaviour !== 'number') return undefined;
    return TEXT_RESIZINGS[textBehaviour];
};

/**
 * 文本垂直对齐——从 style.textStyle.verticalAlignment 读取。
 * 缺省 top 省略：verticalAlignment=0 或字段缺失都视为 top（Sketch 默认），不落 key。
 */
export const verticalAlignToRestore = (layer: SKLayer): string | undefined => {
    const textStyle: any = layer.style && (layer.style as any).textStyle;
    const v = textStyle && typeof textStyle.verticalAlignment === 'number' ? textStyle.verticalAlignment : 0;
    if (v === 0) return undefined; // 缺省 top 省略
    return VERTICAL_ALIGNS[v];
};

/**
 * attributedString → text runs（富文本分段归一化）。
 *
 * Sketch 文本用 NSAttributedString 存储：整段字符串 + 一组 attributes 数组，每段带
 * (location, length, attributes) 描述该区间的字体/字号/颜色/段落属性。本函数把 Sketch 私有
 * 编码翻译成 CSS 通用值（PostScript 字体名 → family+weight+italic，NSColor → hex 等）。
 *
 * 分段兜底：attributes 缺失时（旧文档 / 简单文本）用图层级 textStyle 合成整段单 run。
 * 消费方按"text 节点必有 runs"消费，缺 runs 时字体/颜色/字号信息全丢。
 *
 * 缺省值省略：font / fontFamily / color / lineHeight / letterSpacing / align / italic / decoration
 * 全部条件写入——保持 contentHash 与"缺省值不入指纹"的一致性护栏。
 */
export const textRunsToRestore = (layer: SKLayer): RestoreTextRun[] => memo('textRuns', layer, () => {
    const attributed = layer.attributedString;
    if (!attributed) return [];

    // 分段兜底：无 attributes 数组时用图层级 textStyle 合成单 run 覆盖整段
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
        // Sketch 字体信息嵌两层：MSAttributedStringFontAttribute.attributes = { name, size }
        const fontAttr = attrs.MSAttributedStringFontAttribute && attrs.MSAttributedStringFontAttribute.attributes;
        const fontInfo = fontInfoFromPostScriptName(fontAttr && fontAttr.name);

        const item: RestoreTextRun = {
            from: run.location, // 字符起点（0 基）
            len: run.length,    // 字符长度
        };

        // —— 字体三元组：font(PostScript 名) / fontFamily(空格版本) / fontWeight ——
        if (fontInfo.font) item.font = fontInfo.font;
        if (fontInfo.fontFamily) item.fontFamily = fontInfo.fontFamily;
        item.fontWeight = fontInfo.fontWeight; // 必写（400 也写，方便消费方免判断缺省）
        if (fontInfo.italic) item.italic = true;
        if (fontAttr && typeof fontAttr.size === 'number') item.size = round2(fontAttr.size);

        // —— 颜色 ——
        const color = colorToHex(attrs.MSAttributedStringColorAttribute);
        if (color) item.color = color;

        // —— 段落属性（行高 / 字距 / 对齐 都在 paragraphStyle 里）——
        const paragraph = attrs.paragraphStyle;
        // 只信任正值 lineHeight——0 或负值等同未设置，消费方用 effectiveLineHeight 兜底
        if (paragraph && typeof paragraph.maximumLineHeight === 'number' && paragraph.maximumLineHeight > 0) {
            item.lineHeight = round2(paragraph.maximumLineHeight);
        }
        // kerning=0 是默认值不落 key（历史指纹零漂移的护栏）
        if (typeof attrs.kerning === 'number' && attrs.kerning !== 0) {
            item.letterSpacing = round2(attrs.kerning);
        }
        // 段落对齐：0 缺省 left 不落 key；节点级 align 若全段一致会在 mapNode 里上提
        if (paragraph && typeof paragraph.alignment === 'number' && paragraph.alignment !== 0) {
            const align = TEXT_ALIGNS[paragraph.alignment];
            if (align) item.align = align;
        }

        // —— 装饰线（互斥：下划线优先于删除线，同时开的极少见）——
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
        // 退化判据：起点的 curveFrom 与起点重合、终点的 curveTo 与终点重合 → 无实际曲率，
        // 三次贝塞尔退化为直线段，压成 L 命令减少 SVG path 体积（约 40% 场景可优化）
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

/**
 * Sketch _class → RestoreDSL type 归一化映射。
 *
 * 映射策略：把 Sketch 私有的 20+ 图层类别压到 8 个语义类别（artboard/group/rect/oval/text/
 * slice/image/path），消费方按 type 分派渲染即可，无需再判 Sketch 私有类名。
 *
 * 关键归一：
 *   - group / symbolMaster / symbolInstance / shapeGroup 全部归 'group'——
 *     symbolMaster/Instance 在 annotateStableIds 阶段就应该被展开或标记 componentKey；
 *     shapeGroup 是布尔运算容器，标记 shapeGroup=true 但 type 仍是 group（差异在 mapNode 补）。
 *   - bitmap / image 都归 'image'——bitmap 是原生位图节点，image 是切片替换的占位节点，
 *     消费方按图片一视同仁。
 *   - 未列出的所有矢量类（shapePath / triangle / star / polygon）都归 'path'——
 *     它们的形状差异靠 svgPath 字段承载，type 层不做区分。
 */
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
