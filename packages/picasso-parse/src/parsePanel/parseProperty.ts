import { SKLayer, PanelOptions, Property } from '../types'
import { precisionControl } from '../common/utils'
import { getBorderRadiusList } from '../parseDSL/parseStyle/parseBorderRadius'

/**
 * 基础属性解析
 * @param layer
 */
export const parseProperty = (layer: SKLayer): Property => {
    const { frame, name, style, symbolName='', sharedLayerStyleName = '', sharedTextStyleName ='' } = layer

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
        // 圆角读取统一复用 DSL 样式解析逻辑，保证 Frame 与 rectangle 的表现一致。
        radius: getBorderRadiusList(layer),
        symbolName,
        sharedLayerStyleName,
        sharedTextStyleName,
    }
}
