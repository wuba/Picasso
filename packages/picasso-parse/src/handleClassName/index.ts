import { DLaysr } from '../types';
import classNameList from './classNameList';

/**
 * 为代码添加className
 * @param data
 * @param numObj
 */
const handleClassName =  (data: DLaysr[], numObj = { num: 0 } ): DLaysr[] => {
    for (let i = 0; i < data.length; i++) {
        const layer = data[i];
        const currIndex = numObj.num % classNameList.length;//英文单词下标
        const numIndex = Math.floor(numObj.num / classNameList.length) + 1;//数字后缀

        layer.className = numIndex > 1 ? classNameList[currIndex] + numIndex: classNameList[currIndex];
        numObj.num++;
        if (Array.isArray(layer.children)) {
            layer.children = handleClassName(layer.children,numObj)
        }
    }
    
    return data;
}

export default handleClassName;
