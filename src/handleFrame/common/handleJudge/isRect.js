const twoPointsAngle = require('../handleFill/handleGradientColorFill/twoPointsAngle');
/**
 * 获取点坐标
 *
 * @param {String} PointStr
 * @returns
 */
const getPoint = (PointStr) => {
    return {
        x: +PointStr.split('{')[1].split(',')[0],
        y: -PointStr.split(',')[1].split('}')[0]
    }
}
/**
 * 获取夹角
 *
 * @param {Object} startPoint 起始点
 * @param {Object} midPoint 焦点
 * @param {Object} endPoint 结束点
 * @returns
 */
const getAngle = (startPoint, midPoint, endPoint) => {
    return twoPointsAngle(midPoint.x, midPoint.y, endPoint.x, endPoint.y) - twoPointsAngle(startPoint.x, startPoint.y, midPoint.x, midPoint.y);
}
/**
 * 判断是的为矩形
 *
 * @param {Array} pointArr 4个点数据组信息
 * @returns
 */
module.exports = (pointArr) => {
    // 数据格式
    // pointArr = [{
    //     "_class": "curvePoint",
    //     "cornerRadius": 1,
    //     "curveFrom": "{-2.7755575615628932e-17, 0.33895981354297749}",
    //     "curveMode": 1,
    //     "curveTo": "{-2.7755575615628932e-17, 0.33895981354297749}",
    //     "hasCurveFrom": false,
    //     "hasCurveTo": false,
    //     "point": "{1,1}"
    //   },
    //   {
    //     "_class": "curvePoint",
    //     "cornerRadius": 1,
    //     "curveFrom": "{1.0000000000000002, -0.036806719903440685}",
    //     "curveMode": 1,
    //     "curveTo": "{1.0000000000000002, -0.036806719903440685}",
    //     "hasCurveFrom": false,
    //     "hasCurveTo": false,
    //     "point": "{2,1}"
    //   },
    //   {
    //     "_class": "curvePoint",
    //     "cornerRadius": 1,
    //     "curveFrom": "{1.0000000000000007, 1.0368119470863206}",
    //     "curveMode": 1,
    //     "curveTo": "{1.0000000000000007, 1.0368119470863206}",
    //     "hasCurveFrom": false,
    //     "hasCurveTo": false,
    //     "point": "{2,0}"
    //   },
    //   {
    //     "_class": "curvePoint",
    //     "cornerRadius": 1,
    //     "curveFrom": "{-2.7755575615628932e-17, 0.66104541363990299}",
    //     "curveMode": 1,
    //     "curveTo": "{-2.7755575615628932e-17, 0.66104541363990299}",
    //     "hasCurveFrom": false,
    //     "hasCurveTo": false,
    //     "point": "{1,0}"
    //   }
    // ];

    /**
     * 四边形4个点顺时针依次为 A,B,C,D
     * {
     *   x:0,
     *   y:0
     * }
     */
    let pointA = getPoint(pointArr[0].point),
        pointB = getPoint(pointArr[1].point),
        pointC = getPoint(pointArr[2].point),
        pointD = getPoint(pointArr[3].point);
    //计算4个角度对应的点
    let anglePointArr = [
        [pointA, pointB, pointC],
        [pointB, pointC, pointD],
        [pointC, pointD, pointA],
        [pointD, pointA, pointB]
    ];
    for (let i = 0; i < anglePointArr.length; i++) {
        if ((Math.abs(Math.abs(getAngle(...anglePointArr[i])) - Math.PI / 2) > 0.02) && (Math.abs(Math.abs(getAngle(...anglePointArr[i])) - Math.PI * 1.5) > 0.02)) {
            return false;
        }
    }
    return true;
}

