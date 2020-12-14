import { SKBorders }  from './SKBorders';
import { SKContextSettings }  from './SKContextSettings';
import { SKFills }  from './SKFills';
import { SKBlur }  from './SKBlur';
import { SKShadows }  from './SKShadows';
import { SKTextStyle }  from './SKTextStyle';

export type SKStyle = {
    _class: 'style'
    do_objectID?: string
    endMarkerType?: number
    miterLimit?: number
    startMarkerType?: number
    windingRule?: number
    blur?: SKBlur
    borderOptions?: {
        _class: string
        isEnabled: boolean
        dashPattern: []
        lineCapStyle: number
        lineJoinStyle: number
    }
    borders?: SKBorders
    colorControls?: {
        _class: string
        isEnabled: boolean
        brightness: number
        contrast: number
        hue: number
        saturation: number
    }
    contextSettings?: SKContextSettings
    fills?: SKFills
    innerShadows?: SKShadows
    shadows?: SKShadows
    textStyle?: SKTextStyle
}

// 类型导出
export * from './SKBorders';
export * from './SKContextSettings';
export * from './SKFills';
export * from './SKBlur';
export * from './SKShadows';


