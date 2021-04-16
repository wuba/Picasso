import {transSketchColor } from '../../common/utils';
import { SKLayer, SKColor, TextStyle, SKFillItem } from '../../types';
import handleSolidColorFill from '../parseStyle/parseFill/handleSolidColorFill';

export default (color:SKColor,layer:SKLayer):TextStyle => {
    //01. 如果文本有填充的时候，使用填充色
    let fillList = [];
    // 过滤无效填充
    if (layer.style && Array.isArray(layer.style.fills)) {
        fillList = layer.style.fills.filter(fillItem => {
            return fillItem.isEnabled;
        });
    }
    if (fillList.length>0) {
        // 只解析单层渐变
        const fillStyle: SKFillItem = fillList[fillList.length - 1];
        const fillType = fillStyle.fillType;

        //填充为纯色的情况
        if (fillType === 0) {
            return handleSolidColorFill(fillStyle, layer);
        }
    }
    
    //02. 没有填充的时候，使用默认颜色
    let alpha = color.alpha;
    
    if (layer.style && layer.style.contextSettings) { // colorStyle 里的 alpha 的值都是 1
        alpha = layer.style.contextSettings.opacity * color.alpha; // 设置透明度
    }

    return {
        color: transSketchColor({ red: color.red, green: color.green, blue: color.blue, alpha }),
    } 
}
