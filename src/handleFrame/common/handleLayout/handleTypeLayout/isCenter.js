const isLine = require('./isLine');

/**
 * 判断当前图层是否相对于父元素水平居中
 * 
 * @param {*} layer
 * @param {*} parent
 */
module.exports = (layer, parent) => {
    if (
        parent &&
        parent.width > 750 * 0.7 &&
        layer.width < parent.width * 0.9 &&
        layer.name == 'Row' &&
        layer.children &&
        layer.children.length >= 2 &&
        isLine(layer.children) &&
        Math.abs(layer.x - parent.x - (parent.x + parent.width - layer.x - layer.width)) <= 2
    ) {
        return true;
    }
}