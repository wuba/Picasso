import { SKLayer, PanelOptions, Property } from '../types'
import { precisionControl } from '../common/utils'

/**
 * 基础属性解析
 * @param layer
 */
export const parseProperty = (layer: SKLayer): Property => {
    const { frame, name, style, fixedRadius } = layer

    return {
        name,
        position: {
            x: frame.x,
            y: frame.y,
        },
        size: {
            width: frame.width,
            height: frame.height,
        },
        opacity: precisionControl(style.contextSettings?.opacity, 0.01),
        radius: fixedRadius,
    }
}
