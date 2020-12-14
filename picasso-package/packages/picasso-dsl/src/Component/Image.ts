import { BaseComponent } from './BaseComponent';
import { Component } from './index';

/**
 * 图片组件
 */
export interface Image extends BaseComponent {
    type: 'Image'
    value?: string, // 图片url
    children?: Component[]
}
