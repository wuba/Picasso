export enum WebScale {
    Points = 1,
    Retina = 2,
}

export enum IOSScale {
    Points = 1,
    Retina = 2,
    RetinaHD = 3,
}

export enum AndroidScale {
    MDPI = 1,
    HDPI = 1.5,
    XHDPI = 2,
    XXHDPI = 3,
    XXXHDPI = 4
}

export enum Unit {
    IOS = 'pt',
    Android = 'dp',
    WebPx = 'px',
    WebRem = 'rem',
    Weapp = 'rpx',
    ReactNative = ''
}

export enum ColorFormat {
    HEX = 'hex',
    AHEX = 'ahex',
    HEXA = 'hexa',
    RGBA = 'rgba',
    HSLA = 'hsla',
}

export enum CodeType {
    IOS = 'ios',
    Android = 'android',
    WebPx = 'webpx',
    WebRem = 'webrem',
    Weapp = 'weapp',
    ReactNative = 'reactnative',
}

export type PanelOptions = {
    scale: IOSScale | WebScale | AndroidScale //尺寸缩放
    unit: Unit // 单位
    colorFormat: ColorFormat // 颜色单位
    codeType: CodeType // 代码类型
    remValue?: number // 单位为rem的时候，基础rem值 默认 100
}
