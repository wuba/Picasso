
import { BaseComponent } from './BaseComponent';
import { Component } from './index';

/**
 * 列表项
 */
interface ListItem extends BaseComponent {
    type: 'ListItem',
    children?: Component[]
}

/**
 * 列表组件
 */
export interface List extends BaseComponent {
    type: 'List',
    children: ListItem[]
}
