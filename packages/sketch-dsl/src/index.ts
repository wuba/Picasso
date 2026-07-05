import { SKColor } from './SKColor'
import { SKImage } from './SKImage'
import { SKFrame } from './SKFrame'
import { SKAttributedString } from './SKAttributedString'
import { SKStyle } from './SKStyle'
import { Panel } from './Panel'

/**
 * 图层
 */
export type SKLayer = {
    _class: string // 图层类型
    groupBehavior?: number // 组行为:{ Default: 0, Frame: 1, Graphic: 2 }
    booleanOperation?: number
    isFixedToViewport?: boolean
    do_objectID: string // 图层ID
    name: string // 图层名称
    resizingConstraint?: number
    resizingType?: number
    isLocked?: boolean // 是否锁定
    isVisible: boolean // 是否可见
    layerListExpandedType?: number
    backgroundColor?: SKColor // 图层背景色
    hasBackgroundColor?: boolean // 背景色是否生效
    includeBackgroundColorInExport?: boolean // 导出图片时是否包含背景色
    hasScale?: boolean // 是否缩放
    isFlippedVertical?: boolean // 垂直翻转
    isFlippedHorizontal?: boolean // 水平翻转
    nameIsFixed?: boolean
    points?: any[] // 矢量图描点
    fixedRadius?: number
    rotation?: number // 旋转角度
    shouldBreakMaskChain?: boolean
    exportOptions: {
        // 导出选项
        _class: string
        includedLayerIds: any[]
        layerOptions: number
        shouldTrim: boolean
        exportFormats: any[]
    }
    frame: SKFrame // 图层框架结构
    attributedString?: SKAttributedString // 文本信息
    clippingMaskMode?: number
    hasClippingMask?: boolean
    style?: SKStyle // 图层样式
    hasClickThrough?: boolean
    groupLayout?: {
        _class: string
    }
    imageUrl?: string // 图片url
    image?: SKImage // 图片
    layers?: SKLayer[] // 子图层列表
    includeInCloudUpload?: boolean
    horizontalRulerData?: {
        _class: string
        base: number
        guides: any[]
    }
    verticalRulerData?: {
        _class: string
        base: number
        guides: any[]
    }
    edited?: boolean
    isClosed?: boolean
    pointRadiusBehaviour?: number
    needsConvertionToNewRoundCorners?: boolean
    hasConvertedToNewRoundCorners?: boolean
    panel?: Panel
    symbolName?: string
    symbolComponentObject?: {
        url: string
        code_name: string
        code_lib_name: string
        type?: string
    }
    haikuiComponentInfo?: {
        comId: string
        comType: string
        groupId: string
    }
    sharedLayerStyleName?: string
    sharedTextStyleName?: string
    groupBreadcrumb?: { id: string; name: string; stableId?: string }[]
    textBehaviour?: number // 文本框行为：0 auto-width / 1 auto-height / 2 fixed
    symbolID?: string // symbolInstance / symbolMaster 的组件 ID
    overrideValues?: any[] // symbolInstance 的 override 原始值（导出 A 携带）
    // —— annotateStableIds 注入字段（未注入时不存在，消费方必须条件读取） ——
    stableId?: string // 原稿 do_objectID 的确定性短哈希（Symbol 展开子树内为复合路径）
    contentHash?: string // 节点归一化属性哈希（不含 children）
    subtreeHash?: string // Merkle：hash(contentHash + 有序 children.subtreeHash)
    styleHash?: string // 无几何第二指纹（不含 frame），diff 场景识别「仅移动未改样式」
    restoreComponentKey?: string // RestoreDSL components 字典 key（master symbolID 短哈希）
    restoreOverrides?: { [key: string]: any } // override path 可读化后的键值
}

// 类型导出
export * from './common'
export * from './SKColor'
export * from './SKFrame'
export * from './SKStyle'
export * from './SKImage'
export * from './SKAttributedString'
export * from './Panel'
export * from './PanelOptions'
