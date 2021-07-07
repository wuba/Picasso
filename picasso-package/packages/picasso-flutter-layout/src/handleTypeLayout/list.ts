import { Layer } from '../types';
/**
 * 判断是否相等
 * @param {*} a
 * @param {*} b
 */
const isEqual = (a:number, b:number):boolean => {
    if (Math.abs(a - b) <= 2) {
        return true
    }
    return false
}


export const isList = (data:Layer[]):boolean => {
    let flag = false;
    let flagY = false;
    if (Array.isArray(data) && data.length > 1) {
        let firstItem = data[0];
        flag = true;
        data.forEach(({ structure: { width, height, y }}) => {
            if (!isEqual(width, firstItem.structure.width) || !isEqual(height, firstItem.structure.height)) {
                flag = false;
            }
            if (!isEqual(y, firstItem.structure.y)) {
                flagY = true;
            }
        })
    }

    return flag && flagY;
}

