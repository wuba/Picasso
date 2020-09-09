const isCenter = require('./handleTypeLayout/isCenter');
const isSingleText = require('./handleTypeLayout/isSingleText');

/**
 * 全部为块元素的竖直方向布局
 *
 * @param {*} data
 * @param {*} parent
 * @returns
 */
const calculateBlock = (data, parent) => {

    data = data.sort((a, b) => a.y - b.y);
    //边框处理
    const pBorderWidth = parent.border && parent.border.width ? parent.border.width : 0;
    for (let i = 0; i < data.length; i++) {
        if (!data[i].style) {
            data[i].style = {};
        }
        data[i].style['width'] = data[i].width;

        if (isCenter(data[i], parent)) {
            data[i].isCenter = true;
        }
        if (isSingleText(data[i]) && data[i].style['text-align'] == 'left') {
            data[i].style['width'] = 'auto';
        }
        let marginLeft = data[i].x - parent.x - pBorderWidth;
        if (marginLeft) {
            data[i].style['margin-left'] = marginLeft;
        }
        //假设所有单行文本都是填满的
        if (isSingleText(data[i]) &&
            Math.abs(parent.x + parent.width * 0.5 - (data[i].x + data[i].width * 0.5)) < 3
        ) {
            data[i].style['width'] = 'auto';
            data[i].style['text-align'] = 'center';
            delete data[i].style['margin-left'];
            //去掉 子元素宽度与父元素相同时情况 
        } else if (!isSingleText(data[i]) && Math.abs(parent.x + parent.width * 0.5 - (data[i].x + data[i].width * 0.5)) < 3 && parent.width != data[i].width) {
            if (data[i].style['display'] == 'flex' && data[i].textContainer) { //单行多样式文本的处理
                data[i].style['justify-content'] = 'center';
                data[i].style['width'] = 'auto';
                delete data[i].style['margin-left'];
                delete data[i].style['margin-right'];
            } else {
                data[i].style['margin-left'] = data[i].style['margin-right'] = 'auto';
            }
        }

        if (i > 0) {
            let marginTop = data[i].y - (data[i - 1].y + data[i - 1].height)
            if (marginTop) {
                data[i].style['margin-top'] = marginTop;
            }
        } else {
            let pBorderTop = parent.style && parent.style['border-top'] ? parent.style['border-top'].split('px')[0] / 1 : 0
            let paddingTop = data[i].y - parent.y - pBorderWidth - pBorderTop
            if (paddingTop) {
                data[i].style['margin-top'] = paddingTop;
                parent.style['padding-top'] = 0.1;
            }
        }
    }
    return data;
}

module.exports = calculateBlock;
