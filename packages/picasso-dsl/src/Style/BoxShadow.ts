import { Color } from '../common';
/**
 * 阴影项
 */
export type BoxShadowItem = {
    color: Color
    offsetX: number
    offsetY: number
    spread: number
    blurRadius: number
    type: string
}

/**
 * 阴影
 */
export type BoxShadow = BoxShadowItem[];

