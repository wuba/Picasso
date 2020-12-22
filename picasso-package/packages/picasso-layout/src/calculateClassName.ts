import {
    CLASS_TYPE
} from './const';
import { Layer } from './types';
 
/**
 * 判断是否为竖排列表
 * @param {Array} data
 * 
 */
export const isVerticalList = (data: Layer[]) => {
    if (!(Array.isArray(data) && data.length > 1)) {
        return false;
    }
    if (data.findIndex(item => item.sign !== '__li') > -1) {
        return false;
    }
    const firstItem = data[0];
    for (let i = 1; i < data.length; i++) {
        const currItem = data[i];
        if (Math.abs(currItem.structure.width - firstItem.structure.width) > 3) {
            return false;
        }
        if (Math.abs((currItem.structure.x + currItem.structure.width * 0.5) - (firstItem.structure.x + firstItem.structure.width * 0.5)) > 3) {
            return false;
        }
    }
    return true;
}

/**
 * 处理竖排的className
 * @param {Array} data 
 * @param {Object} parent 
 */
export const calculateVerticalList = (data: Layer[]) => {
    const firstItem = data[0];
    for (let i = 1; i < data.length; i++) {
        const currItem = data[i];
        if (Math.abs(currItem.structure.height - firstItem.structure.height) > 2) {
            data[i].structure.height = firstItem.structure.height;
        }
    }
    data = data.map(item => {
        item.class_name = 'li';
        item.class_type = CLASS_TYPE.RELY_ON_CHILD_AND_PARENT;
        return item;
    });
    return data;
}

/**
 * 判断左边图片右边信息的左右布局
 * @param {*} data 
 * @param {*} parent 
 */
export const isLeftImgRightInfo = (data: Layer[]) => {
    if (Array.isArray(data) &&
        data.length === 2 &&
        data[0].type === 'Image' &&
        Array.isArray(data[1].children) &&
        data[1].children.length >= 3
    ) {
        return true;
    }
    return false;
}
/**
 * 为左边图片右边信息的结构添加className
 * @param {*} data 
 * @param {*} parent 
 */
export const calculateLeftImgRightInfo = (data: Layer[]) => {
    data[0].class_name = 'thumb';
    data[0].class_type = CLASS_TYPE.RELY_ON_PARENT;
    data[1].class_name = 'info';
    data[1].class_type = CLASS_TYPE.RELY_ON_PARENT;
    return data;
}

/**
 * 连续的列表项结构 
 * @param {*} data 
 * @param {*} parent 
 */
export const handleContinuousListItem = (data: Layer[]) => {
    if (!Array.isArray(data) || data.length < 2) {
        return data;
    }
    //列表起始项
    let currStartItem = data[0];
    //列表起始项
    let currStartIndex = 0;
    //列表中项的数量
    let num = 1;
    //列表总数量
    let count = 0;
    for (let i = 1; i < data.length; i++) {
        const currItem = data[i];
        //是否相同
        if (
            Math.abs(currItem.structure.width - currStartItem.structure.width) < 3 &&
            Math.abs(currItem.structure.height - currStartItem.structure.height) < 3 &&
            Math.abs((currItem.structure.x + currItem.structure.width * 0.5) - (currStartItem.structure.x + currStartItem.structure.width * 0.5)) < 3 &&
            Array.isArray(currItem.children) &&
            Array.isArray(currStartItem.children) &&
            currItem.children.length === currStartItem.children.length
        ) {
            num++;
        } else {
            //判断满足条件
            if (num >= 2) {
                count++;
                for (let j = currStartIndex; j < currStartIndex + num; j++) {
                    data[j].class_name = count > 1 ? 'li' + count : 'li';
                    data[j].class_type = CLASS_TYPE.RELY_ON_PARENT;
                }
            }
            currStartIndex = i;
            currStartItem = data[i];
            num = 1;
        }
    }
    //全量满足条件
    if (num === data.length) {
        data = data.map(item => {
            item.class_name = 'li';
            item.class_type = CLASS_TYPE.RELY_ON_CHILD_AND_PARENT;
            return item;
        });
    }
    return data;
}
