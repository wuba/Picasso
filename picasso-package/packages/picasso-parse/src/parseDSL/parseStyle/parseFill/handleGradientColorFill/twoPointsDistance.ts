/**
 * 计算两点之间的距离
 * 根据X轴方向判断正负
 *
 * @param {*} startX
 * @param {*} startY
 * @param {*} endX
 * @param {*} endY
 * @returns
 */
export default (startX:number, startY:number, endX:number, endY:number) => {
    let x = endX - startX;
    let y = endY - startY;
    if (x >= 0) {
        return Math.sqrt(x * x + y * y);
    } else {
        return -Math.sqrt(x * x + y * y);
    }
}
