import { Component, BaseComponent } from './Component';
import { Style } from './Style';
export type DSL = Component[];
export * from './Component';
export * from './Structure';
export * from './Style';
export * from './common';

export interface LStyle extends Style {
    width?: number|string
    height?: number|string
    left?: number|string
    top?: number
    right?: number
    bottom?: number
    position?: string
    display?: string
    justifyContent?: string
    alignItems?: string
    marginTop?: number
    marginLeft?: number
    marginRight?: number
    marginBottom?: number
    paddingRight?: number
    paddingLeft?: number
    paddingBottom?: number
    paddingTop?: number
    textAlign?: string
    flexDirection?: string
    margin?: string
    overflow?: string
}

export interface Layer extends BaseComponent {
    children?: Layer[]
    style?: LStyle
    value?: string
    className?: string
    class?: string
    class_name?: string
    class_type?: number
    panel?: any
    panelData?: any
}
