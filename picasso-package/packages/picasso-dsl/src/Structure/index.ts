import { Border }  from './Border';
import { Margin }  from './Margin';
import { Padding }  from './Padding';
export * from './Border';
export * from './Margin';
export * from './Padding';
export type Structure = {
    x?: number
    y?: number
    width?: number
    height?: number
    zIndex?: number
    margin?: Margin
    padding?: Padding
    border?: Border
}
