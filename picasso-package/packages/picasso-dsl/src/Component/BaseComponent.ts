
import {Structure} from '../Structure';
import {Style} from '../Style';
import { Component } from './index';
import { Panel } from '../../../sketch-dsl/src';
/**
 * 基础组件
 */
export interface BaseComponent {
    id?: string, // 组件唯一ID
    type?: string, // 组件类型
    name?: string, // 组件名称
    structure?: Structure, // 组件结构
    style? : Style // 组件样式
    children?: Component[] // 子组件
    value?: string // 内容
    panel?: Panel // 标注面板
    symbolName?: string //组件名称
    symbolComponentObject?: { // 组件映射对象
        url: string,
        code_name: string,
        code_lib_name: string,
        component_type?: string
    },
    haikuiComponentInfo?: {
        comId: string,
        comType: string,
        groupId: string,
    }
}
