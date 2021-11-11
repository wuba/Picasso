
import { Layer } from './types';
import getBorderWidth from './getBorderWidth';

/**
 *处理绝对定位
 *
 * @param {*} dataIsPositionLayout  需要绝对定位的数组
 * @param {*} parent  父图层
 * @param {*} data 通过其他方式布局的数组
 * @returns
 */
const handleOverlap = (dataIsPositionLayout:Layer[], parent:Layer, data:Layer[]) => {
    if (!parent || dataIsPositionLayout.length == 0) {
        return data;
    }

    const {
        borderTopWidth: parentBorderTopWidth,
        borderLeftWidth: parentBorderLeftWidth
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
        dataIsPositionLayout[i].style.position = 'absolute';
        dataIsPositionLayout[i].style['left'] = dataIsPositionLayout[i].structure.x - parent.structure.x - parentBorderLeftWidth;
        dataIsPositionLayout[i].style['top'] = dataIsPositionLayout[i].structure.y - parent.structure.y - parentBorderTopWidth;
        dataIsPositionLayout[i].style['width'] = dataIsPositionLayout[i].structure.width || 'auto';
        dataIsPositionLayout[i].style['height'] = dataIsPositionLayout[i].structure.height;
    }

    data = [...data, ...dataIsPositionLayout];
    parent.children = data;
    data = parent.children;

    return data;
}

export default handleOverlap;
