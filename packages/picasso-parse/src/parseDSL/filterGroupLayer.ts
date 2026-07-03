import { SKLayer } from '../types'

/**
 * @description 判断组自身是否携带可见样式（启用的填充 / 描边 / 阴影）
 * @param {SKLayer} layer
 * @returns {boolean}
 */
const hasVisualStyle = (layer: SKLayer): boolean => {
    const style = layer.style
    return !!(
        style?.fills?.some((item) => item.isEnabled) ||
        style?.borders?.some((item) => item.isEnabled) ||
        style?.shadows?.some((item) => item.isEnabled) ||
        style?.innerShadows?.some((item) => item.isEnabled)
    )
}

/**
 * @description 去掉分组，同时去掉图层层级
 * @param {SKLayer[]} layers
 * @param {SKLayer[]} [afterLayer=[]]
 * @returns {SKLayer[]}
 */
const filterGroupLayer = (
    layers: SKLayer[],
    afterLayer: SKLayer[] = [],
    type: string,
    groupBreadcrumb: { id: string; name: string; stableId?: string }[] = []
): SKLayer[] => {
    layers.forEach((layer: SKLayer) => {
        // 组的面包屑西信息；stableId 条件写入（被压 group 的唯一存身处，未注入时保持原产物不变）
        const crumb: { id: string; name: string; stableId?: string } = {
            id: layer.do_objectID,
            name: layer.name,
        }
        if (layer.stableId !== undefined) {
            crumb.stableId = layer.stableId
        }
        const $groupBreadcrumb = [...groupBreadcrumb, crumb]
        // 非组件 或 是未解绑组件 或 组件解绑之后的组件
        // 组行为:{ Default: 0, Frame: 1, Graphic: 2 }
        // Graphic 是原子图形单元，保留（正常已在插件端被整组栅格化为 image，这里兜底）；
        // Frame 仅在自身带可见样式时保留为节点，纯组织性 Frame 与 Default 组一样拍平
        if (
            layer._class !== 'group' ||
            layer.groupBehavior === 2 ||
            (layer.groupBehavior === 1 && hasVisualStyle(layer)) ||
            layer.symbolComponentObject ||
            layer.haikuiComponentInfo
        ) {
            afterLayer.push({
                ...layer,
                layers: [],
                groupBreadcrumb: [...$groupBreadcrumb],
            })
        }

        if (Array.isArray(layer.layers)) {
            filterGroupLayer(layer.layers, afterLayer, type, [
                ...$groupBreadcrumb,
            ])
        }
    })
    return afterLayer
}

export default filterGroupLayer
