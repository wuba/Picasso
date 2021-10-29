import { SKLayer } from '../types'

/**
 * @description 去掉分组，同时去掉图层层级
 * @param {SKLayer[]} layers 
 * @param {SKLayer[]} [afterLayer=[]]
 * @returns {SKLayer[]}
 */
const filterGroupLayer = (layers:SKLayer[],afterLayer:SKLayer[]=[], type: string):SKLayer[] => {
    layers.forEach((layer:SKLayer) => {
        // 非组件 或 是未解绑组件 或 组件解绑之后的组件
        if (layer._class!=='group' || layer.symbolComponentObject || layer.haikuiComponentInfo) {
            afterLayer.push({...layer,layers:[]})
        }
        if (Array.isArray(layer.layers)) {
            filterGroupLayer(layer.layers,afterLayer, type);
        }
    })
    return afterLayer;
}

export default filterGroupLayer;
