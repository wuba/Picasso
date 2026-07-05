import { Structure } from '../Structure'
import { Style } from '../Style'
import { Component } from './index'
import { Panel } from '../../../sketch-dsl/src'
/**
 * 基础组件
 */
export interface BaseComponent {
    id?: string // 组件唯一ID
    type?: string // 组件类型
    name?: string // 组件名称
    structure?: Structure // 组件结构
    style?: Style // 组件样式
    children?: Component[] // 子组件
    value?: string // 内容
    panel?: Panel // 标注面板
    symbolName?: string //组件名称
    symbolComponentObject?: {
        // 组件映射对象
        url: string
        code_name: string
        code_lib_name: string
        component_type?: string
    }
    haikuiComponentInfo?: {
        comId: string
        comType: string
        groupId: string
    }
    groupBreadcrumb?: { id: string; name: string; stableId?: string }[] //Symbol group 面包屑
    // —— 稳定 ID / 内容指纹 ——
    // 由 annotateStableIds 在 SKLayer 上原地注入，再由 parseDSL 条件透传到本类型。
    // 「未注入」的老输入产物不落 key（向后兼容护栏，restore.test.ts 有断言）。
    //
    // stableId：原稿画板 do_objectID 的 sha1 短哈希（默认 8 位十六进制，碰撞时该节点延至
    //   12 位）。Symbol 展开子树内为「实例短id/master图层短id」复合路径。
    //   与 Sketch 的 do_objectID 不同，跨解绑副本 / 跨版本可稳定对齐。
    //
    // contentHash：节点归一化属性签名的 sha1 前 8 位，签名内容 = {
    //   类型 t、frame f、visible、rotation、opacity、flip、windingRule、booleanOp、
    //   artboard 背景色、resizingConstraints、stack、borderRadius、
    //   fills / borders / shadows / innerShadows / blur、
    //   text（string + runs + textBehaviour + verticalAlign）、image._ref / imageUrl、
    //   path 的 svgPath
    // }。刻意不含 id / name / children / 绝对坐标——name 是 diff 模糊配对独立打分信号，
    //   绝对坐标会随父级移动漂移。历史盲区：groupBehavior 与 fills/tint 分类语义不入指纹
    //   （见 hash.ts 顶部注释）。
    //
    // subtreeHash：Merkle 结构 sha1(contentHash + 有序 children.subtreeHash) 前 8 位。
    //   子树任一节点变化都会向上冒泡到根，用于 diff 快速裁枝。
    //
    // styleHash：与 contentHash 同签名但**去掉 frame**，sha1 前 8 位。让消费方能识别
    //   「仅移动未改样式」（contentHash 变、styleHash 不变 → moved），几何差异靠消费方
    //   直接比对节点 frame 字段。
    stableId?: string
    contentHash?: string
    subtreeHash?: string
    styleHash?: string
}
