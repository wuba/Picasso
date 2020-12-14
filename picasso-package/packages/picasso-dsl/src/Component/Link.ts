import {BaseComponent} from './BaseComponent';
import {Component} from './index';

/**
 * 链接组件
 */
export interface Link extends BaseComponent {
    type : 'Link'
    target?: '_blank'|'_self'|'_parent'|'_top', // 跳转方式
    href?: string, // 跳转的url
    children?: Component[]
}
