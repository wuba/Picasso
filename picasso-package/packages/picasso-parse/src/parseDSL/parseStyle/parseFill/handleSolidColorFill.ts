import {
    calculateRGB,
    precisionControl
} from '../../../common/utils';
import { SKLayer, SKFillItem, Background } from '../../../types';

export default (fillStyle: SKFillItem, layer:SKLayer): Background => {
    let {
        alpha,
        red,
        green,
        blue
    } = fillStyle.color;
    // 如果设置了 Opacity 属性，则 fills border 需要乘于这个数值
    if (layer.style&&layer.style.contextSettings) {
        alpha = layer.style.contextSettings.opacity * alpha;
    }
    if (alpha > 0) {
        return {
            color: {
                red: calculateRGB(red),
                green: calculateRGB(green),
                blue: calculateRGB(blue),
                alpha: precisionControl(alpha,0.1),
            }
        }
    }
    return {};
}
