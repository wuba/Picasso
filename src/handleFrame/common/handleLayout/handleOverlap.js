
const getBorderWidth = require('./getBorderWidth');

/**
 *处理绝对定位
 *
 * @param {*} dataIsPositionLayout  需要绝对定位的数组
 * @param {*} parent  父图层
 * @param {*} data 通过其他方式布局的数组
 * @returns
 */
const handleOverlap = (dataIsPositionLayout, parent, data) => {
    if (!parent || dataIsPositionLayout.length == 0) {
        return data;
    }
    const {
        layerBorderTopWidth: parentBorderTopWidth,
        layerBorderLeftWidth: parentBorderLeftWidth
    } = getBorderWidth(parent);
    parent.addClassName = 'clearfloat';

    if (parent._class == 'artboard') {
        parent.style['overflow'] = 'hidden';
    }

    if (!parent.style['position']) {
        parent.style['position'] = 'relative';
    }

    //按照由小到到的顺序排列
    for (let i = 0; i < dataIsPositionLayout.length; i++) {
        dataIsPositionLayout[i].style['z-index'] = dataIsPositionLayout[i].index;
        dataIsPositionLayout[i].style['position'] = 'absolute';
        dataIsPositionLayout[i].style['left'] = dataIsPositionLayout[i].x - parent.x - parentBorderLeftWidth;
        dataIsPositionLayout[i].style['top'] = dataIsPositionLayout[i].y - parent.y - parentBorderTopWidth;
        dataIsPositionLayout[i].style['width'] = dataIsPositionLayout[i].width;
        dataIsPositionLayout[i].style['height'] = dataIsPositionLayout[i].height;
    }

    data = [...data, ...dataIsPositionLayout];
    parent.children = data;
    data = parent.children;

    return data;
}

module.exports = handleOverlap;
