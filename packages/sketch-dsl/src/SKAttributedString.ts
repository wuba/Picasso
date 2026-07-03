import { SKColor } from './SKColor';

/**
 * @description 段落文本分布方式
 * @enum {number}
 */
enum SKAlignment {
    Left=0, // 左对齐
    Right=1, // 右对齐
    Center=2, // 居中
    Justify=3, // 两边对齐
}

/**
 * 段落样式
 */
export type SKParagraphStyle = {
    _class: 'paragraphStyle'
    alignment: SKAlignment
    allowsDefaultTighteningForTruncation: number
    maximumLineHeight: number
    paragraphSpacing: number
}

/**
 * 字体描述
 */
export type SKFontDescriptor  ={
    _class: 'fontDescriptor'
    attributes: {
        name: string // 字体名称
        size: number // 字体大小
    }
}

enum SKTextTransformAttribute {
    Normal = 0, // 原始格式展示，不进行转换
    LowerCase = 1, // 转成大写
    UpperCase = 2 // 转成小写
}

export type SKAttributes = {
    MSAttributedStringFontAttribute: SKFontDescriptor
    MSAttributedStringColorAttribute: SKColor
    kerning: number
    textStyleVerticalAlignmentKey: number
    paragraphStyle: SKParagraphStyle
    MSAttributedStringTextTransformAttribute: SKTextTransformAttribute
    underlineStyle: number
    strikethroughStyle: number
}

export type SKStringAttribute = {
    _class: 'stringAttribute'
    location: number
    length: number
    attributes: SKAttributes
}

/**
 * 图层文本属性
 */
export type SKAttributedString = {
    _class: 'attributedString'
    string: string
    attributes: SKStringAttribute[]
}
