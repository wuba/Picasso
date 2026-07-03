import { SKLayer, PanelOptions, Property } from '../types'
import { precisionControl } from '../common/utils'

/**
 * 基础属性解析
 * @param layer
 */
export const parseProperty = (layer: SKLayer): Property => {
    const { frame, name, style, points, _class, symbolName='', sharedLayerStyleName = '', sharedTextStyleName ='' } = layer

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
        radius: _class === 'rectangle' && points.length === 4 ? points.map(({ cornerRadius })=> +cornerRadius): [ 0, 0, 0, 0], // 类型为rectangle且有4个point才会有圆角值
        symbolName,
        sharedLayerStyleName,
        sharedTextStyleName,
    }
}
