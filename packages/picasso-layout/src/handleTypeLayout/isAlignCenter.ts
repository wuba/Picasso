import { Layer } from '../types';
/**
 * 判断是否居中
 */
export const isAlignCenter = (data: Layer[], parent: Layer) => {
    if (Array.isArray(data) && data.length > 1 && parent) {
        const parentY = parent.structure.y + parent.structure.height / 2;
        for (let i = 0; i < data.length; i++) {
            const itemY = data[i].structure.y + data[i].structure.height / 2;
            if (Math.abs(parentY - itemY) > 1) {
                return false;
            }
        }
        return true;
    }
    return false;
}
