/**
 * 判断同层元素是否都在同一行
 * 
 * @param {Array} data 同层元素数组
 */
module.exports = (data) => {
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        for (let j = i; j < data.length; j++) {
            const itemJ = data[j];
            if (itemJ.y >= item.y + item.height || item.y >= itemJ.y + itemJ.height) {
                return false;
            }
        }
    }
    return true;
}
