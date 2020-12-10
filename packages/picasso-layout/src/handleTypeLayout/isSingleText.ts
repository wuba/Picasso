import { Layer } from '../types';
/**
 * 判断图层是否为单行纯文本
 * 
 * @param {Object} layer 图层对象
 */
export const isSingleText = (layer:Layer) => {
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
        || (layer.structure.height && layer.style['font-size'] && layer.style['font-size'] <= layer.structure.height * 0.5)
    ) {
        return false;
    }
    return true;
}
