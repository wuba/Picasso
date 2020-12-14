import { SKColor } from '../SKColor';
import { SKGradient }  from './SKFills';

/**
 * @description Sketch 边框位置
 * @enum {number}
 */
enum SKBorderPosition {
    Inside = 0, // 内边框
    Center = 1, // 中心边框
    Outside = 2 // 外边框
}

/**
 * Sketch 边框项
 */
export type SKBorderItem = {
    fillType: number
    color: SKColor
    gradient: SKGradient
    isEnabled: boolean
    thickness: number
    position: SKBorderPosition
}

export type SKBorders = SKBorderItem[];
