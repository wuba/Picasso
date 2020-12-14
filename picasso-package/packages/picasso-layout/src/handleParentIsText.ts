import { Layer } from './types';
/**
 * 处理父元素是文本的情况， 子元素使用 absoulte 定位
 *
 * @param {*} data
 */
const handleParentIsText = (data: Layer[], parent: Layer) => {
    parent.style['position'] = parent.style['position'] ? parent.style['position'] : 'relative';
    for (let child of data) {
        child.style = {
            ...child.style,
            ...{
                'position': 'absolute',
                'left': child.structure.x - parent.structure.x,
                'top': child.structure.y - parent.structure.y
            }
        }
    }
    return data;
}

export default handleParentIsText;
