import { Layer } from './types';
/**
 *获取各边宽度
 *
 * @param {*} layer
 * @returns
 * {
    layerBorderTopWidth, 
    layerBorderBottomWidth,
    layerBorderLeftWidth,
    layerBorderRightWidth
  }
 */
const getBorderWidth = (layer:Layer):any => {
    //父元素边框宽度
    const border = layer.structure?.border || {};

    return {
        borderTopWidth: border.top?.width || 0,
        borderBottomWidth: border.bottom?.width || 0,
        borderLeftWidth: border.left?.width || 0,
        borderRightWidth: border.right?.width || 0
    }
}
export default getBorderWidth;
