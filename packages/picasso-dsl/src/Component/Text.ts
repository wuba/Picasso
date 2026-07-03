import { BaseComponent } from './BaseComponent';
import { Component } from './index';

export interface Text extends BaseComponent {
    type: 'Text'
    value?: string // 文本内容
    children?: Component[] // 子文本(RN可能会用到)
}
