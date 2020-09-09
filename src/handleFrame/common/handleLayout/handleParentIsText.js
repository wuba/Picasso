/**
 * 处理父元素是文本的情况， 子元素使用 absoulte 定位
 *
 * @param {*} data
 */
const handleParentIsText = (data, parent) => {
    parent.style['position'] = parent.style['position'] ? parent.style['position'] : 'relative';
    for (let child of data) {
        child.style = {
            ...child.style,
            ...{
                'position': 'absolute',
                'left': child.x - parent.x,
                'top': child.y - parent.y
            }
        }
    }
    return data;
}

module.exports = handleParentIsText;
