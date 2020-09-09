/**
 * 计算圆角
 * @param {*} layer 图层
 *  pointRadiusBehaviour: 1 round Corners
 *  pointRadiusBehaviour: 2 smooth Corners
 */

function calculateBorderRadius(layer) {
    if (layer.points && layer.points.length !== 4) { // 不是 4 个锚点组成的不计算圆角
        return ''
    }

    // 如果 points 的模式是   curveMode: 1 的情况， 以四个角的角度作为圆角的大小
    if (layer.points && layer.points.length == 4 && layer.points[0].curveMode == 1 && layer.points[1].curveMode == 1 && layer.points[2].curveMode == 1 && layer.points[3].curveMode == 1 && layer.fixedRadius !== undefined) {
        let cornerRadiusList = [];
        for (let item of layer.points) {
            cornerRadiusList.push(item.cornerRadius);
        }

        if ((new Set(cornerRadiusList).size == 1)) { // 四个角度是一样的
            return `${cornerRadiusList[0]}px`
        } else {
            let [top, right, bottom, left] = cornerRadiusList; // 上、右、下、左

            top = top > layer.frame.height / 2 ? layer.frame.height / 2 : top
            right = right > layer.frame.height / 2 ? layer.frame.height / 2 : right
            bottom = bottom > layer.frame.height / 2 ? layer.frame.height / 2 : bottom
            left = left > layer.frame.height / 2 ? layer.frame.height / 2 : left

            return `${top}px ${right}px ${bottom}px ${left}px`
        }
    }

    // 按照比例计算
    let radius;
    if (layer.layers && layer.layers.length && layer.layers[0].fixedRadius) {
        radius = layer.layers[0].fixedRadius > layer.height / 2 ? layer.height / 2 : layer.layers[0].fixedRadius;
    } else if (layer.fixedRadius) { //兼容52.2版本
        radius = layer.fixedRadius > layer.height / 2 ? layer.height / 2 : layer.fixedRadius;
    }
    return radius ? `${radius}px` : '';
}

module.exports = calculateBorderRadius
