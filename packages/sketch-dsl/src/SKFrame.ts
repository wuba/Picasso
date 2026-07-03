/**
 * 图层框架结构(尺寸位置信息)
 */
export type SKFrame = {
    _class: 'rect'
    constrainProportions?: boolean
    height: number
    width: number
    x: number
    y: number
}
