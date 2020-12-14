
import { Color } from '../common';

/**
 * 文本阴影项
 */
export type TextShadowItem = {
    color: Color
    offsetX: number
    offsetY: number
    spread: number
    blurRadius: number
}

/**
 * 文本阴影
 */
export type TextShadow = TextShadowItem[];
