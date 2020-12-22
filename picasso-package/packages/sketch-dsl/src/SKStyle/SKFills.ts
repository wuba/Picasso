import { SKColor } from '../SKColor';
import { SKImage } from '../SKImage';
import { SKContextSettings } from './SKContextSettings';

/**
 * @description 渐变类型
 * @enum {number}
 */
enum SKGradientType {
    Linear = 0, // 线性渐变
    Radial = 1, // 径向渐变
    Angular = 2 // 环形渐变
}

/**
 * 渐变节点项
 */
export type SKGradientStopItem = {
    _class: 'gradientStop'
    position: number // 渐变节点位置
    color: SKColor
}

/**
 * 渐变
 */
export type SKGradient = {
    _class: 'gradient'
    elipseLength: number
    from: string
    gradientType: SKGradientType
    to: string
    stops: SKGradientStopItem[]
}

/**
 * @description 填充类型
 * @enum {number}
 */
enum SKFillType {
    Color = 0, // 纯色填充
    Gradient = 1, // 渐变填充
    Image = 4, // 图片填充
    Texture = 5 // 纹理效果填充
}

/**
 * @description 图片填充模式类型
 * @enum {number}
 */
enum SKPatternFillType {
    Mask_Tile=0, // 平铺(repect)
    Mask_Fill=1, // 填充(cover)
    Mask_Stretch=2, // 拉伸(stretch)
    Mask_Fit=3 // 包含(contain)
}

/**
 * 填充项
 */
export type SKFillItem = {
    _class: 'fill'
    isEnabled: boolean // 是否生效
    fillType: SKFillType
    color: SKColor // 填充颜色
    contextSettings: SKContextSettings
    gradient: SKGradient // 填充渐变
    image?: SKImage // 填充图片
    noiseIndex: number
    noiseIntensity: number
    patternFillType: SKPatternFillType
    patternTileScale: number
}

/**
 * 填充
 */
export type SKFills = SKFillItem[];
