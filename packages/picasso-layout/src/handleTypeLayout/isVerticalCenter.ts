import { Layer } from '../types';
/**
 * 判断是否垂直居中
 * @param {Array} data
 * @param {Object} parent
 */
export const isVerticalCenter = (data: Layer[], parent: Layer) => {
    if (Array.isArray(data) && data.length > 1 && parent) {
        const parentX = parent.structure.x + parent.structure.width / 2;
        for (let i = 0; i < data.length; i++) {
            const itemX = data[i].structure.x + data[i].structure.width / 2;
            if (Math.abs(parentX - itemX) > 1) {
                return false;
            }
        }
        return true;
    }
    return false;
}
