/**
 * 颜色
 */
export type PColor = {
    red: number;
    green: number;
    blue: number;
    alpha: number;
}

/**
 * 属性
 */
export type Property = {
    name: string // 图层名称
    position: { // 位置
        x: number // x轴
        y: number // y轴
    }
    size: { // 尺寸大小
        width: number // 宽度
        height: number // 高度
    }
    opacity: number // 不透明度
    radius: number[] // 圆角
    symbolName?: string // 对应组件名称
    sharedLayerStyleName?: string // 共享图层样式名称
    sharedTextStyleName?: string // 共享文本样式名称
}

enum Alignment {
    Left = 0, // 水平左对齐
    Right = 1, // 水平右对齐
    Center = 2, // 水平居中对齐
    Justify = 3 // 水平两边对齐
}

enum VerticalAlignment {
    Top = 0, // 垂直顶部对齐
    Center = 1, // 垂直居中对齐
    Bottom = 2, // 垂直底部对齐
}

/**
 * 字体
 */
export type TypeFace = {
    fontFamily: string // 字体
    fontWeight: string // 字重
    alignment: Alignment // 水平对齐方式 左对齐 居中 右对齐 两边对齐
    verticalAlignment: VerticalAlignment // 竖直对齐方式 上|中|下
    color: PColor // 字体颜色
    fontSize: number // 字号
    letterSpacing: number // 字间距
    lineHeight: number // 行间距
    paragraphSpacing: number // 段落
    content: string // 内容
}

enum FillType {
    PureColor = 0, // 纯色填充类型
    linearGradient = 1, // 线性渐变类型
    radialGradient = 2, // 径向渐变类型
    angularGradient = 3, // 环型渐变类型
}

/**
 * 渐变节点
 */
export type Stop = {
    position: number // 渐变点位置，取值范围：[0,1]
    color: PColor
}

/**
 * 线性渐变填充
 */
export type LinearGradientFill = {
    type: FillType.linearGradient, // 线性渐变类型
    stops: Stop[]
}

/**
 * 径向渐变填充
 */
export type RadialGradientFill = {
    type: FillType.radialGradient, // 径向渐变类型
    stops: Stop[]
}

/**
 * 环型渐变填充
 */
export type AngularGradientFill = {
    type: FillType.angularGradient, // 环型渐变类型
    stops: Stop[]
}

/**
 * 纯色填充
 */
export type PrueColorFill = {
    type: FillType.PureColor, // 纯色填充类型
    color: PColor
}

/**
 * 填充
 */
export type Fill = PrueColorFill | LinearGradientFill | RadialGradientFill | AngularGradientFill;

/**
 * 边框位置
 */
enum BorderPosition {
    Center = 0, // 中间边框
    Inside = 1, // 内边框
    Outside = 2, // 外边框
}
/**
 * 边框
 * inside 内边框
 * center 中心边框
 * outside 外边框
 */
export type PBorder = {
    position: BorderPosition // 边框位置
    thickness: number  // 边框宽度
    fill: Fill // 边框颜色
}

/**
 * 阴影类型
 */
enum ShadowType {
    Inner = 0, // 内阴影
    Normal = 1, // 外阴影
}

/**
 * 阴影
 */
export type Shadow = {
    type: ShadowType
    offsetX: number
    offsetY: number
    blurRadius: number
    spread: number
    color: PColor
}

/**
 * 属性面板
 */
export type Panel = {
    // 基础属性
    properties: Property
    // 填充
    fills: Fill[]
    // 字体
    typefaces: TypeFace[]
    // 边框
    borders: PBorder[]
    // 阴影
    shadows: Shadow[]
    // 代码
    code: string
}
