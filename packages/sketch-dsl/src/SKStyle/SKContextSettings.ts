import { SKOpacity } from '../common';

/**
 * 图层透明度
 */
export type SKContextSettings = {
    _class: 'graphicsContextSettings'
    blendMode?: number // 混合模式
    opacity: SKOpacity
}
