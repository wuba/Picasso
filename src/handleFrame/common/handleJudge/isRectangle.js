const isRect = require('./isRect');
// 判断是否是正规的矩形
const isRectangle = (layer) => {
    let isRectangleFlag = true;
    let points = layer.points;
    let curveModeList = [];
    if (layer.points && layer.points.length != 4) {
        return false;
    }

    points.map(item => {
        curveModeList.push(item.curveMode)
        if (item.curveMode != 1) {
            isRectangleFlag = false;
        }
    })

    if (!isRectangleFlag) {
        return isRectangleFlag
    }

    isRectangleFlag = isRect(points)
    return isRectangleFlag;
}

module.exports = isRectangle;
