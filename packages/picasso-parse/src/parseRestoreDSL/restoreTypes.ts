/**
 * RestoreDSL（schemaVersion 1.1）类型定义。
 *
 * 定位：Sketch 画板 → 结构保真中间表示。不做布局推断、不做代码生成、不损失几何精度，
 *      是服务端 diff / LLM 还原 / 跨版本追溯的规范源。
 *
 * 设计原则：
 *  1) 缺省值省略——visible:true / rotation:0 / opacity:1 / 空数组一律不写。
 *     每个可选字段的缺省语义在字段注释里说明；消费方须按缺省行事，不能反过来假设"没写就是坏"。
 *  2) 单位统一 pt（meta.units 固定 'pt'），坐标含 2 位小数（sub-pixel 抖动不改指纹）。
 *  3) 归一化优先——颜色统一 #rrggbbaa、字体拆 family+weight+italic、约束位掩码 → 语义对象；
 *     所有归一化函数集中在 normalize.ts，供 mapNode 与 contentHash 同源使用。
 *  4) 字段命名短化（f/x/y/tl/tr…）仅出现在 hash.ts:contentSignature 内部（省 hash 输入体积），
 *     对外 DSL 字段一律语义化全名。
 *
 * 相关文件：
 *  - hash.ts / annotateStableIds.ts：contentHash / styleHash / subtreeHash / componentKey 来源
 *  - mapNode.ts：SK 树 → RestoreNode 的映射逻辑
 *  - normalize.ts：所有归一化纯函数
 *  - schema/restore-dsl.schema.json：JSON Schema 真源，与本文件同步升级
 */

/**
 * 矩形几何（pt，含 2 位小数）。
 * frame 相对父节点原点；absFrame 相对画板原点（预算好，消费方免逐层累加）。
 */
export type RestoreFrame = {
    x: number; // 左上角 x（父节点相对 / 画板绝对）
    y: number; // 左上角 y
    w: number; // 宽
    h: number; // 高
};

/**
 * 渐变色标——渐变在 from → to 直线上从起点到终点分布的颜色断点。
 */
export type RestoreGradientStop = {
    color: string;   // #rrggbbaa 归一化色（透明度并入 alpha 分量）
    position: number; // 0~1 归一化位置，0=from 端、1=to 端
};

/**
 * CSS-ready 线性渐变（bake.ts 预算好，消费端零计算直接拼 linear-gradient）。
 * angle：CSS 角度（deg，0=向上、顺时针）；stops[].pct：沿 CSS 渐变线的百分位，
 * **可为负 / 超 100**（Sketch from/to 越界语义，浏览器沿渐变线外推，原样输出即可）。
 */
export type RestoreGradientCss = {
    angle: number;
    stops: { color: string; pct: number }[];
};

/**
 * 渐变定义。
 * from / to 是**归一化坐标**（0~1），需乘节点 frame 宽高才是渲染坐标——
 * 消费方勿把它当作绝对像素坐标读。
 * 线性渐变消费 css 字段即可（角度/百分位已按节点实际宽高投影算好）；
 * from/to/stops.position 保留作审计与非 CSS 消费端自算。
 */
export type RestoreGradient = {
    type: 'linear' | 'radial' | 'angular'; // 线性 / 径向 / 角度（Sketch 三种模式）
    from: number[]; // [x, y] 归一化起点（0~1 相对节点 frame）
    to: number[];   // [x, y] 归一化终点
    stops: RestoreGradientStop[]; // 至少 2 个 stop，按 position 升序
    css?: RestoreGradientCss;    // CSS-ready 形态（仅 linear 且节点有面积时写，bake.ts 注入）
};

/**
 * 填充（fills 数组中的一项）——同一节点可叠多层填充，按数组顺序自下向上绘制。
 * color / gradient / image 三者互斥（Sketch fillType 唯一）；token 与前三者可共存
 * （token 只是颜色的可读别名，最终值仍以 color 为准）。
 */
export type RestoreFill = {
    color?: string;                            // #rrggbbaa 纯色填充
    gradient?: RestoreGradient;                // 渐变填充
    image?: { url?: string; mode?: string };   // 图片填充（mode: fill/fit/tile/stretch）
    token?: string;                            // 指向 designTokens.colors 的 key（如 color-3）
};

/**
 * 描边。
 * position 决定描边相对形状轮廓的位置：inside 内描边、center 骑线（默认）、outside 外描边——
 * outside/inside 直接影响节点视觉边界；LLM 还原时若忽略此字段会导致 1~2px 偏差。
 */
export type RestoreBorder = {
    color?: string;             // 纯色描边
    gradient?: RestoreGradient; // 渐变描边
    thickness: number;          // 描边粗细（pt）
    position: 'inside' | 'center' | 'outside'; // 描边定位
    dash?: number[];            // 虚线段 [dash, gap]（可交替多组），缺省实线
};

/**
 * 阴影（可叠加，shadows 数组）。
 * x/y 是阴影偏移，blur 是模糊半径，spread 是外扩量——与 CSS box-shadow 语义一致。
 */
export type RestoreShadow = {
    color: string;  // 阴影颜色（含 alpha）
    x: number;      // 水平偏移（pt，正右负左）
    y: number;      // 垂直偏移（pt，正下负上）
    blur: number;   // 模糊半径（pt）
    spread: number; // 外扩量（pt）
};

/**
 * 文本分段样式（runs 数组中的一项）。
 * Sketch 文本按字符区间分段设置样式（NSAttributedString），本类型对应一段。
 * 无字段变化的相邻段会在 normalize 阶段合并，输出 runs 尽量紧凑。
 */
export type RestoreTextRun = {
    from: number;         // 段起始字符下标（0 基）
    len: number;          // 段长度（字符数，非字节）
    font?: string;        // PostScript 字体名（如 PingFangSC-Medium）
    fontFamily?: string;  // 归一化家族名（如 'PingFang SC'，供 CSS/RN 直接用）
    fontWeight?: number;  // 100~900 数值字重
    italic?: boolean;     // 斜体
    size?: number;        // 字号（pt）
    color?: string;       // 字色 #rrggbbaa
    lineHeight?: number;  // 显式行高（pt），未设时看节点 effectiveLineHeight
    letterSpacing?: number; // 字距（pt，可负）
    align?: string;       // 段落水平对齐（left/center/right/justify），若全段一致会上提到节点 align
    decoration?: string;  // 装饰线（underline/line-through）
    styleToken?: string;  // 指向 designTokens.textStyles 的 key（如 text-1），Sketch 共享文本样式的映射
};

/**
 * 尺寸约束（Sketch 的 resizingConstraint 位掩码解码结果）。
 * pin：四边是否钉住父级——被钉住的边随父级 resize 保持距离不变。
 * fixedWidth/fixedHeight：宽高是否固定——true 则父级 resize 时该维度不变。
 *
 * 消费方按 [pin, fixedWidth/Height] 组合映射到 flex/absolute 定位——例如
 * pin.left && pin.right && !fixedWidth → 左右钉、宽度跟随（水平拉伸）。
 */
export type RestoreConstraints = {
    pin: { left: boolean; right: boolean; top: boolean; bottom: boolean };
    fixedWidth: boolean;
    fixedHeight: boolean;
};

/**
 * Sketch 2025 Frame/GraphicFrame 容器身份。
 * 普通 group 只做图层编组；Frame/GraphicFrame 具备真实背景、圆角、裁剪与后续布局语义。
 */
export type RestoreContainerRole = 'frame' | 'graphicFrame';

/**
 * 新式 Frame 内布局约束（Sketch 2025 horizontalSizing / verticalSizing / pins）。
 * raw 字段保留原始枚举/位掩码，mode/pins 给 LLM 和跨端消费方直接使用。
 */
export type RestoreLayoutConstraints = {
    horizontal?: { raw: number; mode: 'fixed' | 'fit' | 'fill' | 'relative' | 'unknown' };
    vertical?: { raw: number; mode: 'fixed' | 'fit' | 'fill' | 'relative' | 'unknown' };
    pins?: { left: boolean; right: boolean; top: boolean; bottom: boolean; rawHorizontal?: number; rawVertical?: number };
};

/**
 * Sketch Frame / GraphicFrame 圆角扩展语义。
 * borderRadius 仍是跨端可直接渲染的半径；本结构只承载 smooth / concentric 等更高级提示。
 */
export type RestoreCornerHints = {
    style?: 'rounded' | 'smooth' | 'unknown';
    rawStyle?: number;
    smoothing?: number;
    prefersConcentric?: boolean;
};

/**
 * Stack / 自动布局容器语义。
 * spacing 是 1.0 兼容字段；gap 是 1.1 起推荐字段，二者同值时消费方优先用 gap。
 */
export type RestoreStack = {
    direction: 'horizontal' | 'vertical';
    spacing?: number;
    gap?: number;
    crossAxisGap?: number;
    padding?: { left: number; top: number; right: number; bottom: number };
    justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly' | 'unknown';
    alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'none' | 'unknown';
    alignContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly' | 'unknown';
    wraps?: boolean;
};

/**
 * 节点——RestoreDSL 树的基本单元。画板本身是根节点（type='artboard'），下钻 children。
 *
 * 输出策略：
 *  - 缺省值省略（visible/rotation/opacity/空数组 不写）
 *  - 类型相关字段仅在对应 type 下出现（text 才有 runs、image 才有 image 子对象、path 才有 svgPath）
 *  - 组件与指纹字段仅在走 annotateStableIds 后才存在
 */
export type RestoreNode = {
    // ── 标识 & 类型 ──
    id: string;    // 节点稳定 ID（annotateStableIds 注入的 stableId；未注入时走 fallbackNodeId）
    type: string;  // 归一化节点类型：artboard/group/frame/rect/oval/text/image/path/shapeGroup 等
    name: string;  // Sketch 图层名（原样保留，diff 模糊配对的独立打分信号）

    // ── 几何（缺省值省略：visible:true / rotation:0 / opacity:1 不写）──
    frame: RestoreFrame;              // 相对父节点原点的矩形
    absFrame: RestoreFrame;           // 相对画板原点的矩形（预算好，消费方免逐层累加）
    visible?: boolean;                // false 才写（Sketch 隐藏图层）
    rotation?: number;                // Sketch 导出角度（度），消费端按渲染指南映射到目标平台
    opacity?: number;                 // 0~1 不透明度，<1 才写
    flip?: { x?: boolean; y?: boolean }; // 水平/垂直翻转（只写 true 的键）

    // ── 布局 ──
    constraints?: RestoreConstraints;                                     // resize 约束（见 RestoreConstraints）
    layoutConstraints?: RestoreLayoutConstraints;                         // Sketch 2025 Frame 内 sizing / pins 语义
    stack?: RestoreStack;                                                 // Sketch Stack 布局（自动排布）

    // ── 视觉样式 ──
    containerRole?: RestoreContainerRole; // groupBehavior 1/2 的显式容器身份，普通 group 省略
    clipsContents?: boolean;       // Frame / GraphicFrame 是否裁剪子层；true 时消费端必须 overflow/clip
    borderRadius?: number[];        // 四角圆角 [tl, tr, br, bl]（全 0 省略）
    cornerHints?: RestoreCornerHints; // smooth / concentric 等高级圆角语义，平台不支持时退化为 borderRadius
    fills?: RestoreFill[];          // 填充叠层（从下到上），空数组省略
    borders?: RestoreBorder[];      // 描边叠层
    shadows?: RestoreShadow[];      // 外阴影叠层
    innerShadows?: RestoreShadow[]; // 内阴影叠层
    blur?: { type: string; radius: number }; // 模糊（gaussian/motion/zoom/background）

    // ── 矢量（type=path/shapeGroup 时才有） ──
    svgPath?: string;          // SVG path d 字符串（相对节点 frame 内坐标）
    windingRule?: string;      // svgPath 填充规则：nonzero；缺省 evenodd 省略
    booleanOperation?: string; // 参与父级布尔运算的运算符（union/subtract/intersect/difference）

    // ── 文本（type=text 时才有）──
    text?: string;              // 完整文本内容（runs 的 string 拼接）
    textResizing?: string;      // 文本框自适应模式：auto-width（宽随内容）/auto-height（高随内容）/fixed（固定框）
    verticalAlign?: string;     // 垂直对齐：top（缺省，省略）/center/bottom
    align?: string;             // 节点级段落水平对齐（runs 全段一致时上提，left 缺省省略）
    runs?: RestoreTextRun[];    // 分段样式（见 RestoreTextRun）
    // runs 无显式行高时的有效行高（pt）：单行取 frame 高（= Sketch 实算默认行高），
    // 多行按 1.4x 字号近似；textResizing=fixed 不写。消费方取 run.lineHeight ?? effectiveLineHeight
    effectiveLineHeight?: number;

    // ── 编组分类（渲染差异语义拆分）──
    // 普通编组的 fills 是子图标着色提示（tint），不渲染为背景（shapeGroup 的真填充仍在 fills）。
    // 纯色 tint 在 bake 阶段已下发到子孙 fills/borders/runs 的 color 并删除本字段——
    // 正常产物里不再出现；仅渐变着色（极罕见，无法逐色下发）保留原样
    tint?: RestoreFill[];
    // 布尔运算形状组标记：type 同为 group，但 fills 为真实填充、children 为布尔子路径
    shapeGroup?: boolean;
    renderHint?: string;      // 带 image 的 group 渲染意图：image = 必须用切图渲染（插件端注入）
    rasterizeReason?: string; // 整组切图判定原因：slice / irregular-vector / export-format（插件端注入）

    // ── 图片（type=image / 或带 renderHint=image 的 group 时才有；子字段由插件端注入）──
    // image.url：切图 URL（相对路径或绝对 URL）
    // image.svgUrl：同切图的矢量版本（可选，优先展示矢量）
    // image.w/h：位图实际像素尺寸（PNG IHDR 实测值，含导出倍率，导出失败等降级时缺省）
    // image.scale：位图导出倍率（1/2/3/4，缺省时取 meta.assetsScale）
    // image.frame：切图位图的实际渲染范围（画板绝对坐标，含阴影/模糊 bleed，可能大于节点 frame）
    // image.mode：填充模式（fill/fit/tile/stretch），bitmap 类默认 fill
    image?: {
        url?: string;
        svgUrl?: string;
        w?: number;
        h?: number;
        scale?: number;
        frame?: RestoreFrame;
        mode?: string;
    };

    // ── 组件（annotateStableIds 在解绑点回填；非组件实例节点不写）──
    componentKey?: string;              // 指向 components 字典 key（原 Symbol 的 symbolID 短哈希）
    overrides?: { [key: string]: any }; // 实例覆盖值（可读键路径 → 覆盖值），见 annotateStableIds.resolveOverrides

    // ── Diff 指纹（annotateStableIds 注入，见 hash.ts）──
    contentHash?: string;  // 节点自身归一化属性指纹（含 frame），diff 精确配对主键
    // 无几何内容指纹（contentSignature 去掉 frame）：识别「仅移动未改样式」的第二配对轮
    styleHash?: string;
    subtreeHash?: string;  // Merkle 子树指纹，diff 快速裁枝（整棵子树未变可跳过）

    // ── 子节点 ──
    children?: RestoreNode[]; // 有序（z 序，先绘制在下）；文本/图片/path 通常无 children
};

/**
 * 设计 tokens 字典——高频重复值聚合，节点侧仅存 token key 引用，避免重复展开。
 *
 * key 命名：swatches 拿不到原名时自动命名 color-N / text-N（N 按出现顺序递增）；
 *          有共享样式时原名落 sourceName 字段。
 * usages：该 token 被引用次数（判断是否值得抽出，消费方也可用来排展示优先级）。
 */
export type RestoreDesignTokens = {
    colors?: {
        [name: string]: {
            value: string; // #rrggbbaa 归一化色值
            usages: number; // 被引用次数
        };
    };
    textStyles?: {
        [name: string]: {
            font?: string;       // PostScript 字体名
            size?: number;       // 字号（pt）
            color?: string;      // 字色
            lineHeight?: number; // 行高（pt）
            usages: number;      // 被引用次数
            sourceName?: string; // Sketch 共享文本样式原名（key 统一为 text-N，原名落此字段）
        };
    };
};

/**
 * 组件定义（components 字典的 value）——由 Sketch symbolMaster 展开的定义树。
 * 同一 Symbol 无论被实例化多少次，字典里只有一份 tree，节点侧靠 componentKey 引用。
 */
export type RestoreComponentDef = {
    name: string;      // Symbol 显示名
    symbolID: string;  // 原始 symbolID（Sketch UUID，供跨文档追溯）
    source: string;    // 来源：local（本文档）/ external（外部 Library）/ inherited（来自继承）
    tree?: RestoreNode; // 定义树根节点；外部 Library 且 mastersC 未提供时缺省（componentsOmitted=true）
};

/**
 * picassoArtboardRestoreParse 的 options 入参形状——插件端注入运行时元数据。
 * 除 generatedAt 外均可选；缺省时对应 meta 字段直接不写。
 */
export type RestoreMetaOptions = {
    sketchVersion?: string;      // Sketch 应用版本（如 '99.1'）
    pluginVersion?: string;      // Picasso 插件端版本
    documentId?: string;         // Sketch 文档 UUID（跨画板归一）
    generatedAt?: string;        // 生成时间戳（ISO 8601 或测试固定串）
    componentsOmitted?: boolean; // 外部 Library master 缺失时置 true，标识组件字典不完整
    assetsBaseUrl?: string;      // 相对路径图片资源的基地址（图片走 WOS 绝对 URL 时无需传）
    assetsScale?: number;        // 切图统一导出倍率（image.scale 缺省时的全局值，插件端按 sliceSize 计算传入）
};

/**
 * RestoreDSL 顶层产物——picassoArtboardRestoreParse 的返回类型。
 */
export type RestoreDSL = {
    schemaVersion: string;      // RESTORE_SCHEMA_VERSION 常量值（如 '1.1'），消费方按此判定格式兼容性
    meta: {
        sketchVersion?: string;    // Sketch 应用版本（如 '99.1'），插件端注入；缺省表示非插件流程
        pluginVersion?: string;    // Picasso 插件端版本，插件端注入；用于关联客户端 bug
        parserVersion: string;     // PARSER_VERSION 常量值，做实现溯源（诊断"这份产物哪版解析器出的"）
        documentId?: string;       // Sketch 文档 UUID，跨画板归一（同文档多画板共享 documentId）
        generatedAt?: string;      // 生成时间戳（ISO 8601 或测试固定串），用于版本时间线定位
        units: 'pt';               // 固定 'pt'，所有坐标 / 尺寸单位；消费方无需再判读
        componentsOmitted?: boolean; // 外部 Library master 缺失时置 true，标识 components 字典不完整
        assetsBaseUrl?: string;    // 相对路径图片资源的基地址（图片走 WOS 绝对 URL 时无需传）
        assetsScale?: number;      // 切图统一导出倍率（image.scale 缺省时的全局值，插件端按 sliceSize 计算传入）
    };
    designTokens: RestoreDesignTokens;                  // 高频值聚合字典（颜色 + 文本样式）
    components: { [key: string]: RestoreComponentDef }; // 组件定义字典（key = componentKey = 原 Symbol symbolID 短哈希）
    artboard: RestoreNode;                              // 画板根节点，下钻 children 是整棵树（type='artboard'）

    // 内部回传字段（不可枚举挂载，JSON.stringify 不落产物）：画板主树 B 侧 do_objectID →
    // 节点 id（含 stableId 缺省时的兜底 id），插件端切片 URL 回填降级路径命中用
    idByDoObjectID?: { [uuid: string]: string };
};

// RestoreDSL 输出格式版本：只加字段升 minor；破坏性变更升 major（原则上禁止）。
// 修改输出格式时必须在同一次提交里手动更新此常量（对应 DB 列 dsl_format_version），
// 并同步 schema/restore-dsl.schema.json。
// 1.0：对外首发版本。所有 CSS-ready 化能力（bake.ts 后处理，语义收敛到 parse 单点，
//      消费端零推断）与结构性字段均并入首发——包含但不限于：
//      flip / windingRule / booleanOperation / 节点级 align / renderHint / rasterizeReason /
//      fill.token / run.styleToken / textStyles.sourceName（key 统一 text-N）/
//      meta.assetsBaseUrl / meta.assetsScale / 画板背景色落 fills（必填，缺省显式白底）/
//      text 节点 runs 兜底 / path 节点 svgPath 兜底 / effectiveLineHeight（行高兜底）/
//      tint + shapeGroup（编组 fills 语义拆分，普通 group 的 fills 落 tint 字段；纯色
//      tint bake 下发子孙 fills/borders/runs.color 后删除，正常产物不再出现）/
//      text.fills bake 下发 runs[].color 后删除 / gradient.css（线性渐变 CSS 角度+
//      百分位预算值）/ 带切图 url 节点（含 group/shapeGroup 栅格化）不再带 rotation/flip
//      （契约：字段出现 = 消费端必须应用）/ stroke-only 细直线转等效 fills 矩形 /
//      group 直接子级 slice 的同 frame 切图上提到 group（renderHint=image 补齐）/
//      被 Mask 裁剪图层的渐变 from/to 按裁剪前 frame 重映射 /
//      styleHash（无几何第二指纹）/ image.svgUrl / image.frame + image.scale + image.w/h
//      （切图 bleed 元数据，插件端注入）。
// 1.1：补齐 Sketch 2025 Frame/GraphicFrame 跨端还原语义：containerRole / clipsContents /
//      cornerHints / layoutConstraints / stack padding+gap+alignment，供 LLM 多端代码生成少猜。
export const RESTORE_SCHEMA_VERSION = '1.1';

// 解析包版本常量（与 package.json 同步手工维护，写入 meta.parserVersion 做实现溯源）
export const PARSER_VERSION = '0.0.45-beta.10';
