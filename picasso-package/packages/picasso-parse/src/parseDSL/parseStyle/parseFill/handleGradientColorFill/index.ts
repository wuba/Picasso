import handleLinearGradient from './handleLinearGradient';
import handleRadialGradient from './handleRadialGradient';
import { SKLayer,SKFillItem,Background } from '../../../../types';

export default (fillStyle:SKFillItem, layer:SKLayer):Background => {

    if (!fillStyle.gradient) {
        return {}
    }

    let gradient = fillStyle.gradient;
    let contextSettings = fillStyle.contextSettings ? fillStyle.contextSettings.opacity : 1;
    let gradientType = gradient.gradientType;
    if (gradientType === 0) { // 线性渐变
        return {
            linearGradient: handleLinearGradient(gradient, layer, contextSettings)
        }
    }
    if (gradientType === 1) { // 径向渐变
        return {
            radialGradient: handleRadialGradient(gradient, layer, fillStyle, contextSettings)
        }
    }
    if (gradientType === 2) { // 环形渐色，导出该图层为图片
        return {}
    }
}
