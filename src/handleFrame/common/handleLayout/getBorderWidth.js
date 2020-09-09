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
const getBorderWidth = (layer) => {
    //父元素边框宽度
    const layerBorderWidth = layer.border && layer.border.width ? layer.border.width : 0;
    /**
     * 根据边框宽带类型获取对应的边框宽度
     *
     * @param {String} borderType  边框宽度类型 可选值： 'border-top','border-bottom','border-left','border-right'
     * @returns
     */
    const getBorderWidthByType = (borderType) => {
        return layer.style && layer.style[borderType] && layer.style[borderType] ? layer.style[borderType] : layerBorderWidth;
    }
    //上边框宽度
    const layerBorderTopWidth = getBorderWidthByType('border-top');
    //下边框宽度
    const layerBorderBottomWidth = getBorderWidthByType('border-bottom');
    //左边框宽度
    const layerBorderLeftWidth = getBorderWidthByType('border-left');
    //右边框宽度
    const layerBorderRightWidth = getBorderWidthByType('border-right');
    return {
        layerBorderTopWidth,
        layerBorderBottomWidth,
        layerBorderLeftWidth,
        layerBorderRightWidth
    }
}
module.exports = getBorderWidth;