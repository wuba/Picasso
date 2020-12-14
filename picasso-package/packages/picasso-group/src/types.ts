import { BaseComponent } from '../../picasso-dsl/src';
export * from '../../picasso-dsl/src';

export interface Layer extends BaseComponent {
    delete?: boolean
    isPosition?: boolean
    sign?: string
    class?: string
    _class?: string
    class_name?: string
    class_type?: number
    textContainer?: boolean
    children?: Layer[]
    isList?: boolean
    isVisible?: boolean
    parentId?: string
    istransformContain?: boolean
    isDelete?: boolean
    isLabelList?: boolean
    marginBottom?: number
    marginRight?: number
}
