import { calculateRGB,precisionControl } from '../../common/utils'
import { SKLayer, Background } from '../../types'

export default (layer: SKLayer): Background => {
    if (
        layer.backgroundColor &&
        layer.hasBackgroundColor &&
        layer.includeBackgroundColorInExport
    ) {
        let { alpha, red, green, blue } = layer.backgroundColor
        // 如果设置了 Opacity 属性，则 fills border 需要乘于这个数值
        if (layer.style&&layer.style.contextSettings) {
            alpha = layer.style.contextSettings.opacity * alpha
        }
        if (alpha > 0) {
            return {
                color: {
                    red: calculateRGB(red),
                    green: calculateRGB(green),
                    blue: calculateRGB(blue),
                    alpha: precisionControl(alpha,0.1),
                },
            }
        }
    }
    return {
        color: {
            red: 255,
            green: 255,
            blue: 255,
            alpha: 1,
        }
    }
}
