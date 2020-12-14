/**
 * 依据两点坐标计算两点与原点之间连线的夹角
 *
 * @param {*} startX 第一个点X轴坐标
 * @param {*} startY 第一个点Y轴坐标
 * @param {*} endX 第二个点X轴坐标
 * @param {*} endY 第二个点Y轴坐标
 * @returns
 */
export default (startX:number, startY:number, endX:number, endY:number) => {
    let x = endX - startX;
    let y = endY - startY;
    if (x > 0 && y == 0) {
        return Math.PI * 0.5
    }
    if (x < 0 && y == 0) {
        return Math.PI * 1.5
    }
    if (y > 0 && x == 0) {
        return 0
    }
    if (y < 0 && x == 0) {
        return Math.PI
    }
    if (x >= 0 && y >= 0) {
        return Math.atan(x / y)
    }
    if (x >= 0 && y < 0) {
        return Math.PI + Math.atan(x / y)
    }
    if (x < 0 && y > 0) {
        return 2 * Math.PI + Math.atan(x / y)
    }
    if (x < 0 && y <= 0) {
        return Math.PI + Math.atan(x / y)
    }
}
