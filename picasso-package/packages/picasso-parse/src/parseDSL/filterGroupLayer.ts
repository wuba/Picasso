import { SKLayer } from '../types'

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
    groupBreadcrumb: { id: string; name: string }[] = []
): SKLayer[] => {
    layers.forEach((layer: SKLayer) => {
        // 组的面包屑西信息
        const $groupBreadcrumb = [
            ...groupBreadcrumb,
            { id: layer.do_objectID, name: layer.name },
        ]

        // 非组件 或 是未解绑组件 或 组件解绑之后的组件
        if (
            layer._class !== 'group' ||
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
