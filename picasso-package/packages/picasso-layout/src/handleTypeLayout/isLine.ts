import { Layer } from '../types';
/**
 * 判断同层元素是否都在同一行
 * 
 * @param {Array} data 同层元素数组
 */
export const isLine = (data:Layer[]) => {
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        for (let j = i; j < data.length; j++) {
            const itemJ = data[j];
            if (itemJ.structure.y >= item.structure.y + item.structure.height || item.structure.y >= itemJ.structure.y + itemJ.structure.height) {
                return false;
            }
        }
    }
    return true;
}
