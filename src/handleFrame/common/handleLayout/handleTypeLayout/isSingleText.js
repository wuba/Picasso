/**
 * 判断图层是否为单行纯文本
 * 
 * @param {Object} layer 图层对象
 */
const isSingleText = (layer) => {
    if (layer.type != "Text") {
        return false;
    }
    if (!layer.style) {
        return false;
    }
    if (layer.style['border-radius']
        || layer.style['border']
        || layer.style['background-color']
        || layer.style['background']
        || layer.style['background-image']
        || (layer.height && layer.style['font-size'] && layer.style['font-size'] <= layer.height * 0.5)
    ) {
        return false;
    }
    return true;
}

module.exports = isSingleText;