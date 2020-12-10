import twoPointsAngle from './twoPointsAngle';

/**
 * 获取夹角
 *
 * @param {Object} startPoint 起始点
 * @param {Object} midPoint 焦点
 * @param {Object} endPoint 结束点
 * @returns
 */

const getAngle = (startPoint, midPoint, endPoint) => (twoPointsAngle(midPoint.x, midPoint.y, endPoint.x, endPoint.y)
    - twoPointsAngle(startPoint.x, startPoint.y, midPoint.x, midPoint.y));

/**
 * 判断是的为矩形
 *
 * @param {Array} pointArr 4个点数据组信息
 * @returns
 */
export default (pointArr) => {
    /**
     * 四边形4个点顺时针依次为 A,B,C,D
     * {
     *   x:0,
     *   y:0
     * }
     */

    const { point: pointA } = pointArr[0];
    const { point: pointB } = pointArr[1];
    const { point: pointC } = pointArr[2];
    const { point: pointD } = pointArr[3];

    // 计算4个角度对应的点
    const anglePointArr = [
        [pointA, pointB, pointC],
        [pointB, pointC, pointD],
        [pointC, pointD, pointA],
        [pointD, pointA, pointB],
    ];

    for (let i = 0; i < anglePointArr.length; i++) {
        if ((Math.abs(Math.abs(getAngle(anglePointArr[i][0], anglePointArr[i][1], anglePointArr[i][2])) - Math.PI / 2) > 0.02)
            && (Math.abs(Math.abs(getAngle(anglePointArr[i][0], anglePointArr[i][1], anglePointArr[i][2])) - Math.PI * 1.5) > 0.02)) {
            return false;
        }
    }

    return true;
};
