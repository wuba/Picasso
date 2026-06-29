import { BaseComponent,Style } from '../../picasso-dsl/src';
export * from '../../picasso-dsl/src';

interface LStyle extends Style {
    width?: number | string
    height?: number
    left?: number
    top?: number
    right?: number
    bottom?: number
    position?: string
    display?: string
    flexDirection?: string
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
}

export interface Layer extends BaseComponent {
    isPosition?: boolean
    sign?: string
    class?: string
    _class?: string
    class_name?: string
    class_type?: number
    textContainer?: boolean
    children?: Layer[]
    delete?: boolean
    isList?: boolean
    addClassName?: string
    isCenter?: boolean
    isOnlyText?: boolean
    style?: LStyle
    value?: string
}
