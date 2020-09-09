// 判断是否是正圆
const isOval = (layer) => {
    let isOvalFlag = true;
    let points = layer.points;
    let curveModeList = [];
    if (layer.points && layer.points.length != 4) {
        return false;
    }
    points.map(item => {
        curveModeList.push(item.curveMode)
    })
    if (curveModeList.includes(1)) {
        return false;
    }

    for (let i = 0; i < points.length; i++) {
        let item = points[i];
        let curveFromAry = item.curveFrom.slice(1, -1).split(', ');
        let corveToAry = item.curveTo.slice(1, -1).split(', ');
        let pointAry = item.point.slice(1, -1).split(', ');
        if (i == 0 || i == 2) {
            if (curveFromAry[1] != corveToAry[1] || corveToAry[1] != pointAry[1]) {
                isOvalFlag = false;
                break;
            }
        } else if (i == 1 || i == 3) {
            if (curveFromAry[0] != corveToAry[0] || corveToAry[0] != pointAry[0]) {
                isOvalFlag = false;
                break;
            }
        }
    }

    if (isOvalFlag) {
        // 判断是否是正圆
        if (Math.abs(layer.frame.width - layer.frame.height) >= 0.1) { // 表示是一个椭圆
            isOvalFlag = false;
        }
    }

    return isOvalFlag;
}

module.exports = isOval;