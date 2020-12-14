import { Color } from '../common';

/**
 * 边框类型
 */
enum borderStyleType {
    Dotted = 'dotted',
    Solid = 'solid',
    Double = 'double',
    Dashed = 'dashed'
}

/**
 * 边框项
 */
export type BorderItem = {
    width: number
    style: 'dotted' | 'solid' | 'double' | 'dashed'
    color: Color
}

/**
 * 边框
 */
export type Border = {
  left?: BorderItem
  top?: BorderItem
  right?: BorderItem
  bottom?: BorderItem
}
