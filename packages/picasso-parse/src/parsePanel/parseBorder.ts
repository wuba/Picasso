import { SKLayer, PBorder, Fill } from '../types';
import { transSketchColor } from '../common/utils';

/**
 * 边框解析
 * 1. 对纯色填充、渐变填充进行了解析。
 * 2. TODO 图片填充及其他填充未进行解析。
 *  
 * @param layer
 */
export const parseBorder = (layer: SKLayer): PBorder[] => {
    const { borders = [] } = layer.style;

    return borders.filter(({ isEnabled, fillType }) => isEnabled&&([0,1].includes(fillType))) // 过滤出纯色、渐变切可用的填充边框才解析
        .map(({ position, thickness, color, fillType, gradient }) => {

            let fill: Fill;

            // 纯色填充
            if (fillType === 0) {
                fill = {
                    type: 0,
                    color: transSketchColor(color)
                }
            // 渐变填充
            } else if (fillType === 1&&[0,1,2].includes(gradient.gradientType)) {
                fill = {
                    type: gradient.gradientType+1, // 填充类型转换
                    stops: gradient.stops.map(({ position, color }) => ({
                        position,
                        color: transSketchColor(color),
                    }))
                }
            }

            return {
                position: +position,
                thickness,
                fill
            }
        });
};
