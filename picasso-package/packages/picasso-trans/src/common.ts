import { WebScale, IOSScale, AndroidScale } from './types';
/**
 * 精度控制
 * @param data 需要处理的数据
 * @param num 精度 eg. 0.1 0.01
 */
export const precisionControl = (data: number, num: number = 1) => {
    const len =  Math.round(1/num).toString().length-1;
    
    return +((Math.round(data/num)*num).toFixed(len));
}
export const _scale = (data: any, scale: WebScale | IOSScale | AndroidScale) => typeof data === 'number' ? precisionControl(data / scale,0.01) : data;
