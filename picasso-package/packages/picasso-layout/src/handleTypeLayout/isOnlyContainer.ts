import { Layer } from '../types';
/**
 * 判断图层是否为纯容器
 * 
 * @param {Object} layer 图层对象
 */
export const isOnlyContainer = (layer:Layer) => {
    if (layer.type != "Container") {
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
    ) {
        return false;
    }
    return true;
}
