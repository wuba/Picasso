/**
 * RestoreDSL（schemaVersion 1.0）类型定义。
 * 设计原则：缺省值省略——visible:true / rotation:0 / opacity:1 / 空数组一律不写。
 */

export type RestoreFrame = {
    x: number;
    y: number;
    w: number;
    h: number;
};

export type RestoreGradientStop = {
    color: string;
    position: number;
};

export type RestoreGradient = {
    type: 'linear' | 'radial' | 'angular';
    from: number[];
    to: number[];
    stops: RestoreGradientStop[];
};

export type RestoreFill = {
    color?: string;
    gradient?: RestoreGradient;
    image?: { url?: string; mode?: string };
    token?: string; // 指向 designTokens.colors 的 key（如 color-3）
};

export type RestoreBorder = {
    color?: string;
    gradient?: RestoreGradient;
    thickness: number;
    position: 'inside' | 'center' | 'outside';
    dash?: number[];
};

export type RestoreShadow = {
    color: string;
    x: number;
    y: number;
    blur: number;
    spread: number;
};

export type RestoreTextRun = {
    from: number;
    len: number;
    font?: string;
    fontFamily?: string;
    fontWeight?: number;
    italic?: boolean;
    size?: number;
    color?: string;
    lineHeight?: number;
    letterSpacing?: number;
    align?: string;
    decoration?: string;
    styleToken?: string; // 指向 designTokens.textStyles 的 key（如 text-1）
};

export type RestoreConstraints = {
    pin: { left: boolean; right: boolean; top: boolean; bottom: boolean };
    fixedWidth: boolean;
    fixedHeight: boolean;
};

export type RestoreNode = {
    id: string;
    type: string;
    name: string;
    frame: RestoreFrame;
    absFrame: RestoreFrame;
    visible?: boolean;
    rotation?: number;
    opacity?: number;
    flip?: { x?: boolean; y?: boolean };
    constraints?: RestoreConstraints;
    stack?: { direction: 'horizontal' | 'vertical'; spacing?: number };
    borderRadius?: number[];
    fills?: RestoreFill[];
    borders?: RestoreBorder[];
    shadows?: RestoreShadow[];
    innerShadows?: RestoreShadow[];
    blur?: { type: string; radius: number };
    svgPath?: string;
    windingRule?: string; // svgPath 填充规则，缺省 evenodd 省略
    booleanOperation?: string; // 参与父级布尔运算的运算符（union/subtract/intersect/difference）
    text?: string;
    textResizing?: string;
    verticalAlign?: string;
    align?: string; // 节点级段落水平对齐（runs 全段一致时上提，left 缺省省略）
    runs?: RestoreTextRun[];
    // [1.2] runs 无显式行高时的有效行高（pt）：单行取 frame 高（= Sketch 实算默认行高），
    // 多行按 1.4x 字号近似；textResizing=fixed 不写。消费方取 run.lineHeight ?? effectiveLineHeight
    effectiveLineHeight?: number;
    // [1.2] 普通编组的 fills 是子图标着色提示（tint），不渲染为背景（shapeGroup 的真填充仍在 fills）
    tint?: RestoreFill[];
    // [1.2] 布尔运算形状组标记：type 同为 group，但 fills 为真实填充、children 为布尔子路径
    shapeGroup?: boolean;
    renderHint?: string; // 带 image 的 group 渲染意图：image = 必须用切图渲染（插件端注入）
    rasterizeReason?: string; // 整组切图判定原因：slice / irregular-vector / export-format（插件端注入）
    // [1.2] image.frame：切图位图的实际渲染范围（画板绝对坐标，含阴影/模糊 bleed，可能大于节点
    // frame，插件端注入）；image.w/h：位图实际像素尺寸（PNG IHDR 实测值，含导出倍率，插件端注入，
    // 导出失败等降级时缺省）；image.scale：位图导出倍率；image.svgUrl：同切图的矢量版本（插件端注入）
    image?: {
        url?: string;
        svgUrl?: string;
        w?: number;
        h?: number;
        scale?: number;
        frame?: RestoreFrame;
        mode?: string;
    };
    componentKey?: string;
    overrides?: { [key: string]: any };
    contentHash?: string;
    // [1.2] 无几何内容指纹（contentSignature 去掉 frame）：识别「仅移动未改样式」的第二配对轮
    styleHash?: string;
    subtreeHash?: string;
    children?: RestoreNode[];
};

export type RestoreDesignTokens = {
    colors?: { [name: string]: { value: string; usages: number } };
    textStyles?: {
        [name: string]: {
            font?: string;
            size?: number;
            color?: string;
            lineHeight?: number;
            usages: number;
            sourceName?: string; // Sketch 共享文本样式原名（key 统一为 text-N，原名落此字段）
        };
    };
};

export type RestoreComponentDef = {
    name: string;
    symbolID: string;
    source: string;
    tree?: RestoreNode;
};

export type RestoreMetaOptions = {
    sketchVersion?: string;
    pluginVersion?: string;
    documentId?: string;
    generatedAt?: string;
    componentsOmitted?: boolean;
    assetsBaseUrl?: string; // 相对路径图片资源的基地址（图片走 WOS 绝对 URL 时无需传）
    assetsScale?: number; // [1.2] 切图统一导出倍率（image.scale 缺省时的全局值，插件端按 sliceSize 计算传入）
};

export type RestoreDSL = {
    schemaVersion: string;
    meta: {
        sketchVersion?: string;
        pluginVersion?: string;
        parserVersion: string;
        documentId?: string;
        generatedAt?: string;
        units: 'pt';
        componentsOmitted?: boolean;
        assetsBaseUrl?: string;
        assetsScale?: number;
    };
    designTokens: RestoreDesignTokens;
    components: { [key: string]: RestoreComponentDef };
    artboard: RestoreNode;
    // 内部回传字段（不可枚举挂载，JSON.stringify 不落产物）：画板主树 B 侧 do_objectID →
    // 节点 id（含 stableId 缺省时的兜底 id），插件端切片 URL 回填降级路径命中用
    idByDoObjectID?: { [uuid: string]: string };
};

// RestoreDSL 输出格式版本：只加字段升 minor；破坏性变更升 major（原则上禁止）。
// 修改输出格式时必须在同一次提交里手动更新此常量（对应 DB 列 dsl_format_version），
// 并同步 schema/restore-dsl.schema.json。
// 1.1：新增 flip / windingRule / booleanOperation / 节点级 align / renderHint / rasterizeReason /
//      fill.token / run.styleToken / textStyles.sourceName（key 统一 text-N）/ meta.assetsBaseUrl /
//      画板背景色落 fills / text 节点 runs 兜底 / path 节点 svgPath 兜底
// 1.2：新增 effectiveLineHeight（行高兜底）/ tint + shapeGroup（编组 fills 语义拆分，注意普通
//      group 的 fills 从 1.2 起落 tint 字段）/ styleHash（无几何第二指纹）/ image.svgUrl 补登记 /
//      image.frame + image.scale + image.w/h（切图 bleed 元数据，插件端注入）/ meta.assetsScale
export const RESTORE_SCHEMA_VERSION = '1.2';

// 解析包版本常量（与 package.json 同步手工维护，写入 meta.parserVersion 做实现溯源）
export const PARSER_VERSION = '0.0.45-beta.1';
