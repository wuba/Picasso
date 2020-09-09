/**
 * 判断是否垂直居中
 * @param {Array} data
 * @param {Object} parent
 */
const isVerticalCenter = (data, parent) => {
    if (Array.isArray(data) && data.length > 1 && parent) {
        const parentX = parent.x + parent.width / 2;
        for (let i = 0; i < data.length; i++) {
            const itemX = data[i].x + data[i].width / 2;
            if (Math.abs(parentX - itemX) > 1) {
                return false;
            }
        }
        return true;
    }
    return false;
}

module.exports = isVerticalCenter;