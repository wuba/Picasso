import { BaseComponent } from './BaseComponent';
import { Component } from './index';

/**
 * 容器组件
 */
export interface Container extends BaseComponent {
    type : 'Container'
    children?: Component[]
}
