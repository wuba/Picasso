import { SKLayer,SKFillItem } from '../types';



/**
 * @description 两个图层进行比较，判断图层layerB是否在layerA中间的位置
 * @param {Layer} layerA
 * @param {Layer} layerB
 * @returns {boolean}
 */
export const isAlignCenter = (layerA:SKLayer, layerB:SKLayer):boolean => {
    return Math.abs((layerA.frame.x + layerA.frame.width / 2) - (layerB.frame.x + layerB.frame.width / 2)) <= 5;
}

/**
 * @description 颜色值转换
 * @param {number} color 颜色
 * @returns {number}
 */
export const calculateRGB = (color:number):number => {
    return Math.round(color * 255);
}

// 判断是否包含可用的 fill
export const getEnabledFill = (layer:SKLayer) => {
    if (layer.style?.fills) {
        return layer.style.fills.filter((item:SKFillItem) => item.isEnabled).pop();
    }
    return undefined;
}

/**
 * 精度控制
 * @param data 需要处理的数据
 * @param num 精度 eg. 0.1 0.01
 */
export const precisionControl = (data: number, num: number = 1) => {
    const len =  Math.round(1/num).toString().length-1;
    
    return +((Math.round(data/num)*num).toFixed(len));
}

/**
 * @description 转换sketch中的color => rgba值
 * @param {*} { red, green, blue, alpha }
 */
export const transSketchColor = ({ red, green, blue, alpha }) => ({
    red: calculateRGB(red),
    green: calculateRGB(green),
    blue: calculateRGB(blue),
    alpha: precisionControl(alpha,0.01),
});
