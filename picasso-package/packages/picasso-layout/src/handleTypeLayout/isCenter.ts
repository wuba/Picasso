import { isLine } from './isLine';
import { Layer } from '../types';

/**
 * 判断当前图层是否相对于父元素水平居中
 * 
 * @param {*} layer
 * @param {*} parent
 */
export const isCenter =  (layer: Layer, parent: Layer) => {
    if (
        parent &&
        parent.structure.width > 750 * 0.7 &&
        layer.structure.width < parent.structure.width * 0.9 &&
        layer.name == 'Row' &&
        layer.children &&
        layer.children.length >= 2 &&
        isLine(layer.children) &&
        Math.abs(layer.structure.x - parent.structure.x - (parent.structure.x + parent.structure.width - layer.structure.x - layer.structure.width)) <= 2
    ) {
        return true;
    }
}
