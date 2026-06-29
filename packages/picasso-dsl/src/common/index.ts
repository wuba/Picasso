/**
 * 取值范围: 0-255的数字
 */
type colorNumber = number

/**
 * 颜色
 */
export type Color = {
    red: colorNumber
    green: colorNumber
    blue: colorNumber
    alpha: number // 取值范围 0-1
}

/**
 * 位置
 */
export type Position = {
    top?: number
    bottom?: number
    left?: number
    right?: number
}
