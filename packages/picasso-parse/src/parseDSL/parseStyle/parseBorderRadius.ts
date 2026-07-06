import { SKLayer,BorderRadius } from '../../types';
import { precisionControl } from '../../common/utils'
// import * as fs from 'fs';

/**
 * 获取当前图层允许的最大圆角。
 * @param layer Sketch 图层，用于读取 frame 宽高。
 * @returns 当前图层可渲染圆角上限；无有效尺寸时返回 0。
 */
const getMaxRadius = (layer: SKLayer): number => {
    // CSS/Sketch 最终视觉上圆角不会超过短边的一半，超出值按胶囊处理。
    const width = layer.frame?.width || 0;
    const height = layer.frame?.height || 0;
    return Math.max(0, Math.min(width, height) / 2);
}

/**
 * 统一清洗单个圆角值。
 * @param radius Sketch 导出的圆角值，可能为空、负数或超大哨兵值。
 * @param layer 圆角所属图层，用于按短边一半做 clamp。
 * @returns 清洗后的非负圆角值。
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
 * 读取 Sketch 2025 style.corners 圆角数组。
 * @param layer Sketch 图层，Frame / GraphicFrame 常把圆角存在 style.corners.radii。
 * @returns 四角圆角数组；无有效圆角字段时返回 undefined。
 */
const getStyleCornersRadiusList = (layer: SKLayer): number[] | undefined => {
    const radii = layer.style?.corners?.radii;
    if (!Array.isArray(radii) || !radii.length) {
        return undefined;
    }

    // radii.length === 1 表示四角同值；radii.length === 4 表示四角独立值。
    const radiusList = radii.length === 1
        ? [radii[0], radii[0], radii[0], radii[0]]
        : radii.slice(0, 4);

    if (radiusList.length !== 4) {
        return undefined;
    }

    // style.corners 同样可能携带 Sketch 超大哨兵值，输出前统一清洗。
    return radiusList.map(radius => normalizeRadius(radius, layer));
}

/**
 * 统一读取图层四角圆角，返回顺序为：左上、右上、右下、左下。
 * @param layer Sketch 图层。
 * @returns 四角圆角数组 [tl, tr, br, bl]；无圆角时返回全 0。
 */
export const getBorderRadiusList = (layer: SKLayer): number[] => {
    // rectangle 和 Frame 都可能通过 points[].cornerRadius 表达四角独立圆角。
    const points = Array.isArray(layer.points) ? layer.points : [];

    if (points.length === 4) {
        const pointRadiusList = points.map(({ cornerRadius }) => normalizeRadius(cornerRadius, layer));
        // points 中存在有效圆角时优先使用，保留四角独立设置。
        if (pointRadiusList.some(radius => radius > 0)) {
            return pointRadiusList;
        }
    }

    const styleCornersRadiusList = getStyleCornersRadiusList(layer);
    if (styleCornersRadiusList?.some(radius => radius > 0)) {
        return styleCornersRadiusList;
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
