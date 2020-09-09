/**
 * 边框处理规则
 * 1.边框为第一个或者最后一个子元素 
 *   a.优先处理成父元素边框
 *   b.处理成子元素的边框时，优先处理成下边框
 * @param {Array} data 
 */
const handleBorder = (data, parent = {}) => {
    if (!parent.style) {
        parent.style = {};
    }
    for (let i = 0; i < data.length; i++) {
        //可以处理成边框条件
        if (data.length > 1) {
            if (0 < data[i].height && data[i].height <= 2 && data[i].style && (data[i].style['background-color'] || data[i].style['border'])) {
                if (i == 0) {
                    //border放到父元素上
                    if (parent.width == data[i].width && data[i].y == parent.y && !parent.style['border']) {
                        parent.style['border-top'] = `${data[i].height}px solid ${data[i].style['border'] ? data[i].style['border'].split('solid')[1].trim('') : data[i].style['background-color']}`
                        data[i].isBorderDelete = true;
                    } else {
                        if (!data[i + 1].style) {
                            data[i + 1].style = {};
                        }
                        if (data[i + 1].width == data[i].width && !data[i + 1].style['border']) {
                            data[i + 1].style['border-top'] = `${data[i].height}px solid ${data[i].style['border'] ? data[i].style['border'].split('solid')[1].trim('') : data[i].style['background-color']}`;
                            data[i + 1].height = +data[i + 1].height + data[i + 1].y - data[i].y;
                            data[i + 1].y = data[i].y;
                            data[i].isBorderDelete = true;
                        }
                    }
                } else {
                    //border放到父元素上
                    //1px误差
                    if (i == data.length - 1 && parent.width == data[i].width && Math.abs(+data[i].y + data[i].height - parent.y - parent.height) <= 1 && !parent.style['border']) {
                        parent.style['border-bottom'] = `${data[i].height}px solid ${data[i].style['border'] ? data[i].style['border'].split('solid')[1].trim('') : data[i].style['background-color']}`
                        data[i].isBorderDelete = true;
                    } else {
                        if (!data[i - 1].style) {
                            data[i - 1].style = {};
                        }
                        if (data[i - 1].width == data[i].width && !data[i - 1].style['border']) {
                            if (!data[i - 1].style) {
                                data[i - 1].style = {};
                            }
                            data[i - 1].style['border-bottom'] = `${data[i].height}px solid ${data[i].style['border'] ? data[i].style['border'].split('solid')[1].trim('') : data[i].style['background-color']}`
                            data[i - 1].height = +data[i].y - data[i - 1].y + data[i].height;
                            data[i].isBorderDelete = true;
                        }
                    }
                }
            }
        }
        if (Array.isArray(data[i].children)) {
            data[i].children = handleBorder(data[i].children, data[i]);
        }
    }
    const currData = [];
    for (let j = 0; j < data.length; j++) {
        if (!data[j].isBorderDelete) {
            currData.push(data[j]);
        }
    }
    return currData;
}

module.exports = handleBorder;
