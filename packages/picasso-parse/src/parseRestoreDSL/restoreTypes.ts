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
    renderHint?: string; // 带 image 的 group 渲染意图：image = 必须用切图渲染（插件端注入）
    rasterizeReason?: string; // 整组切图判定原因：slice / irregular-vector / export-format（插件端注入）
    image?: { url?: string; w?: number; h?: number; mode?: string };
    componentKey?: string;
    overrides?: { [key: string]: any };
    contentHash?: string;
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
    };
    designTokens: RestoreDesignTokens;
    components: { [key: string]: RestoreComponentDef };
    artboard: RestoreNode;
};

// RestoreDSL 输出格式版本：只加字段升 minor；破坏性变更升 major（原则上禁止）。
// 修改输出格式时必须在同一次提交里手动更新此常量（对应 DB 列 dsl_format_version），
// 并同步 schema/restore-dsl.schema.json。
// 1.1：新增 flip / windingRule / booleanOperation / 节点级 align / renderHint / rasterizeReason /
//      fill.token / run.styleToken / textStyles.sourceName（key 统一 text-N）/ meta.assetsBaseUrl /
//      画板背景色落 fills / text 节点 runs 兜底 / path 节点 svgPath 兜底
export const RESTORE_SCHEMA_VERSION = '1.1';

// 解析包版本常量（与 package.json 同步手工维护，写入 meta.parserVersion 做实现溯源）
export const PARSER_VERSION = '0.0.45-beta.0';
