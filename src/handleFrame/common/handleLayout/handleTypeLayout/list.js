/**
 * 判断是否相等
 * @param {*} a
 * @param {*} b
 */
const isEqual = (a, b) => {
    if (Math.abs(a - b) <= 2) {
        return true
    }
    return false
}

module.exports = {
    isList(data) {
        let flag = false;
        let flagY = false;
        if (Array.isArray(data) && data.length > 1) {
            let firstItem = data[0];
            flag = true;
            data.forEach(({ width, height, y }) => {
                if (!isEqual(width, firstItem.width) || !isEqual(height, firstItem.height)) {
                    flag = false;
                }
                if (!isEqual(y, firstItem.y)) {
                    flagY = true;
                }
            })
        }

        return flag && flagY;
    }
}
