/**
 * 判断是否居中
 */
module.exports = (data, parent) => {
    if (Array.isArray(data) && data.length > 1 && parent) {
        const parentY = parent.y + parent.height / 2;
        for (let i = 0; i < data.length; i++) {
            const itemY = data[i].y + data[i].height / 2;
            if (Math.abs(parentY - itemY) > 1) {
                return false;
            }
        }
        return true;
    }
    return false;
}