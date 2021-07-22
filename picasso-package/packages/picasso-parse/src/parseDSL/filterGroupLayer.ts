import { SKLayer } from '../types'

/**
 * @description 去掉分组，同时去掉图层层级
 * @param {SKLayer[]} layers 
 * @param {SKLayer[]} [afterLayer=[]]
 * @returns {SKLayer[]}
 */
const filterGroupLayer = (layers:SKLayer[],afterLayer:SKLayer[]=[]):SKLayer[] => {
    layers.forEach((layer:SKLayer) => {
        if (layer._class!=='group' || layer.symbolComponentObject) {
            afterLayer.push({...layer,layers:[]})
        }
        if (Array.isArray(layer.layers)) {
            filterGroupLayer(layer.layers,afterLayer);
        }
    })
    return afterLayer;
}

export default filterGroupLayer;
