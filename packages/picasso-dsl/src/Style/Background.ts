import { Color } from '../common';

/**
 * 背景图片
 */
type Image = {
    url: string
}

/**
 * 背景图位置
 */
export type BGPosition = {
    left: number|string
    top: number|string
}

/**
 * 背景图尺寸
 */
export type BGSize = {
    width: number|string
    height: number|string
}

/**
 * 渐变节点列表
 */
export type GListItem = {
    color: Color // 颜色值
    position: number // 位置
}

/**
 * 线性渐变
 */
export type LinearGradient = {
    gAngle: number // 渐变角度
    gList: GListItem[] // 渐变节点列表
}

/**
 * 圆角渐变
 */
export type RadialGradient = {
    smallRadius: number // 短轴长度
    largeRadius: number // 长轴长度
    position: { // 中心点位置
        left: number|string
        top: number|string
    } // 中心点位置
    gList: GListItem[] // 渐变节点列表
}

/**
 * 
 */
export enum BackgroundRepeat {
    'repeat',
    'repeat-x',
    'no-repeat',
    'repeat-y'
}

/**
 * 背景
 */
export type Background = {
    color?: Color // 背景色
    image?: Image // 背景图
    position?: BGPosition // 背景位置
    size?: BGSize|'contain'|'cover' // 背景尺寸
    repeat?: 'repeat'|'repeat-x'|'no-repeat'|'repeat-y' // 重复类型
    linearGradient?: LinearGradient
    radialGradient?: RadialGradient
}
