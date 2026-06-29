import { SKLayer,Fill } from '../types';
import { transSketchColor } from '../common/utils';

/**
 * 填充样式解析
 * 0. 画板=>取背景色即可
 * 1. 填充解析
 *   a. 对纯色填充、渐变填充进行了解析。
 *   b. 图片填充及其他填充未进行解析。
 *  
 * @param layer
 */
export const parseFill = (layer: SKLayer): Fill[] => {
    // 1. 画板 => 取背景色即可
    if (layer._class === 'artboard' && layer.hasBackgroundColor) {
        return [{
            type: 0,
            color: transSketchColor(layer.backgroundColor),
        }]
    }

    // 2. 其他图层
    const { fills = [] } = layer.style;

    return fills
         // 过滤出纯色、渐变切可用的填充
        .filter(({ isEnabled, fillType }) => isEnabled&&([0,1].includes(fillType)))
        .map(({ fillType, color, gradient }) => {
            // 纯色填充
            if (fillType === 0) {
                return {
                    type: 0,
                    color: transSketchColor(color)
                }
            }
            // 渐变填充
            if (fillType === 1&&[0,1,2].includes(gradient.gradientType)) {
                return {
                    type: gradient.gradientType+1, // 填充类型转换
                    stops: gradient.stops.map(({ position, color }) => ({
                        position,
                        color: transSketchColor(color),
                    }))
                }
            }
        });
};
