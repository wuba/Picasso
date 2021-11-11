import { SKLayer,BorderRadius } from '../../types';
import { precisionControl } from '../../common/utils'
import * as fs from 'fs';
/**
 * 计算圆角
 * @param {*} layer 图层
 *  pointRadiusBehaviour: 1 round Corners
 *  pointRadiusBehaviour: 2 smooth Corners
 */
const calculateBorderRadius = (layer:SKLayer):BorderRadius=> {
    if (layer.points && layer.points.length !== 4) { // 不是 4 个锚点组成的不计算圆角
        return {}
    }

    // 如果 points 的模式是   curveMode: 1 的情况， 以四个角的角度作为圆角的大小
    if (layer.points && layer.points.length == 4 && layer.points[0].curveMode == 1 && layer.points[1].curveMode == 1 && layer.points[2].curveMode == 1 && layer.points[3].curveMode == 1 && layer.fixedRadius !== undefined) {
        const cornerRadiusList = [];
        for (let item of layer.points) {
            cornerRadiusList.push(item.cornerRadius);
        }
        const [topLeft, topRight, bottomRight, bottomLeft] = cornerRadiusList; // 上、右、下、左

        return {
            topLeft: precisionControl(topLeft),
            topRight: precisionControl(topRight),
            bottomRight: precisionControl(bottomRight),
            bottomLeft: precisionControl(bottomLeft)
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
    let radius:number = 0;

    if (layer.layers && layer.layers.length && layer.layers[0].fixedRadius) {
        radius = layer.layers[0].fixedRadius > layer.frame.height / 2 ? layer.frame.height / 2 : layer.layers[0].fixedRadius;
    } else if (layer.fixedRadius) { //兼容52.2版本
        radius = layer.fixedRadius > layer.frame.height / 2 ? layer.frame.height / 2 : layer.fixedRadius;
    }

    return {
        topLeft: precisionControl(radius),
        topRight: precisionControl(radius),
        bottomRight: precisionControl(radius),
        bottomLeft: precisionControl(radius)
    }
}

export default calculateBorderRadius;
