import { SKLayer, Shadow } from '../types';
import { transSketchColor } from '../common/utils';

/**
 * 边框解析
 * 1. 对纯色填充、渐变填充进行了解析。
 * 2. TODO 图片填充及其他填充未进行解析。
 *  
 * @param layer
 */
export const parseShadow = (layer: SKLayer): Shadow[] => {
    const { shadows = [], innerShadows = [] } = layer.style;

    return [ ...shadows, ...innerShadows].filter(({ isEnabled }) => isEnabled) // 过滤出可用的阴影
        .map(({ offsetX, offsetY, blurRadius, spread, color, _class }) => ({
            type: _class === 'innerShadow' ? 0 : 1,
            offsetX,
            offsetY,
            blurRadius,
            spread,
            color: transSketchColor(color)
        }));
};
