const isSingleText = require('../common/handleLayout/handleTypeLayout/isSingleText');
const {
    PLATFORM
} = require('../../common/global');

/**
 * 运营专版布局
 */
module.exports = (data, platform) => {
    data[0].style['width'] = data[0].width;
    data[0].style['heigth'] = data[0].heigth;
    data[0].style['overflow'] = 'hidden';
    if (platform === PLATFORM.pc) {
        data[0].style['position'] = 'absolute';
        data[0].style = {
            ...data[0].style,
            position: 'absolute',
            left: '50%',
            top: 0,
            "margin-left": - Math.round(data[0].width * 0.5),
        }
    } else {
        data[0].style['position'] = 'relative';
    }
    const childLayerList = data.slice(1).map(item => {
        item.style = {
            ...item.style,
            position: 'absolute',
            left: Math.round(item.x),
            top: Math.round(item.y),
            width: item.width,
            heigth: item.heigth,
        }
        /**
         * 单行文本不设置宽度
         */
        if (isSingleText(item)) {
            item.style['width'] = 'auto';
        }
        return item;
    });
    return [{
        ...data[0],
        children: childLayerList
    }];
}