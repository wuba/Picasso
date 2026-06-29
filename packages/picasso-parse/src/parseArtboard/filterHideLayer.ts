import { SKLayer } from '../types'
/**
 * 过滤掉隐藏图层
 * @param layers
 */
const handleHideLayer = (layers:SKLayer[]):SKLayer[] => {
    const layerArr:SKLayer[] = [];
    layers.forEach((layer:SKLayer) => {
        if (layer.isVisible) {
            if (Array.isArray(layer.layers)) {
                layer.layers = handleHideLayer(layer.layers);
            }
            layerArr.push(layer)
        }
    })
    return layerArr;
}

export default handleHideLayer;
