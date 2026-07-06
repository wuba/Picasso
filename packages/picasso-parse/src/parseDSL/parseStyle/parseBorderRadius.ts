import { SKLayer,BorderRadius } from '../../types';
import { precisionControl } from '../../common/utils'
// import * as fs from 'fs';

/**
 * 获取当前图层允许的最大圆角。
 */
const getMaxRadius = (layer: SKLayer): number => {
    // CSS/Sketch 最终视觉上圆角不会超过短边的一半，超出值按胶囊处理。
    const width = layer.frame?.width || 0;
    const height = layer.frame?.height || 0;
    return Math.max(0, Math.min(width, height) / 2);
}

/**
 * 统一清洗单个圆角值。
 */
const normalizeRadius = (radius: any, layer: SKLayer): number => {
    // 非数字、负数和空值都按无圆角处理，避免脏数据进入 DSL。
    const value = Number(radius) || 0;
    if (value <= 0) {
        return 0;
    }

    // Sketch 可能导出超大哨兵值，输出前收敛到真实可渲染上限。
    const maxRadius = getMaxRadius(layer);
    return precisionControl(maxRadius ? Math.min(value, maxRadius) : value);
}

/**
 * 统一读取图层四角圆角，返回顺序为：左上、右上、右下、左下。
 */
export const getBorderRadiusList = (layer: SKLayer): number[] => {
    // rectangle 和 Frame 都可能通过 points[].cornerRadius 表达四角独立圆角。
    const points = Array.isArray(layer.points) ? layer.points : [];

    if (points.length === 4) {
        return points.map(({ cornerRadius }) => normalizeRadius(cornerRadius, layer));
    }

    // 老版本 Sketch 或 Frame 容器会把统一圆角放在 fixedRadius 上。
    let radius:number = 0;
    if (layer.layers && layer.layers.length && layer.layers[0].fixedRadius) {
        radius = layer.layers[0].fixedRadius;
    } else if (layer.fixedRadius) { //兼容52.2版本
        radius = layer.fixedRadius;
    }

    const value = normalizeRadius(radius, layer);
    return [value, value, value, value];
}

/**
 * 判断图层是否存在有效圆角。
 */
export const hasBorderRadius = (layer: SKLayer): boolean => (
    // 任意一角大于 0 都代表该图层带有需要保留的视觉语义。
    getBorderRadiusList(layer).some(radius => radius > 0)
)

/**
 * 计算圆角
 * @param {*} layer 图层
 *  pointRadiusBehaviour: 1 round Corners
 *  pointRadiusBehaviour: 2 smooth Corners
 *  四个角顺序：左上、右上、右下、左下
 */
const calculateBorderRadius = (layer:SKLayer):BorderRadius=> {
    if (layer.points && layer.points.length > 0 && layer.points.length !== 4) { // 不是 4 个锚点组成的不计算圆角
        return {}
    }

    // 如果 points 的模式是   curveMode: 1 的情况， 以四个角的角度作为圆角的大小
    if (layer.points && layer.points.length == 4 && layer.points[0].curveMode == 1 && layer.points[1].curveMode == 1 && layer.points[2].curveMode == 1 && layer.points[3].curveMode == 1 && layer.fixedRadius !== undefined) {
        const cornerRadiusList = getBorderRadiusList(layer);
        const [topLeft, topRight, bottomRight, bottomLeft] = cornerRadiusList; // 上、右、下、左

        return {
            topLeft,
            topRight,
            bottomRight,
            bottomLeft
        }
    }

    // 如果 points 的模式是 curveMode: 2 cornerRadius: 0 的情况，为正圆
    if (layer.points?.length === 4 && layer.points[0].curveMode === 2 && layer.points[1].curveMode === 2 && layer.points[2].curveMode === 2 && layer.points[3].curveMode === 2) {
        const cornerRadiusList = [];
        for (let item of layer.points) {
            cornerRadiusList.push(item.cornerRadius);
        }
        const [topLeft, topRight, bottomRight, bottomLeft] = cornerRadiusList; // 上、右、下、左
        if (topLeft===0 && topRight===0 && bottomRight===0 && bottomLeft===0 ) {
            return {
                topLeft: '50%',
                topRight: '50%',
                bottomRight: '50%',
                bottomLeft: '50%',
            }
        }
    }

    // 按照比例计算
    const [topLeft, topRight, bottomRight, bottomLeft] = getBorderRadiusList(layer);

    return {
        topLeft,
        topRight,
        bottomRight,
        bottomLeft
    }
}

export default calculateBorderRadius;
