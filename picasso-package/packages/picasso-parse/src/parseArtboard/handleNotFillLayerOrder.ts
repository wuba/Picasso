import { SKLayer } from '../types'
/**
 * 透明图层判断方法，需满足下方所有条件
 * 1. fills数组为空
 * 2. 图层类型_class: 'rectangle', 'triangle', 'oval', 'star', 'polygon',只对这几种类型做处理
 * @param layer
 */
const isTouMing = (layer: SKLayer) => {
    if(!['rectangle', 'triangle', 'oval', 'star', 'polygon'].includes(layer._class)) {
        return false;
    }

    if(!(layer.style?.fills?.filter(item=>item.isEnabled).length === 0)){
        return false;
    }

    return true;
}

/**
 * 处理没有填充的图层遮挡问题
 * 
 * @param layers
 */
const handleNotFillLayerOrder = (layers: SKLayer[]): SKLayer[] => {

    layers.sort((bLayer: SKLayer, aLayer: SKLayer) => {
        const aLayerIsTouMing = isTouMing(aLayer);
        const bLayerIsTouMing = isTouMing(bLayer);

        // a 不透明，b 透明；当a无法完全覆盖b的时候替换顺序
        if (!aLayerIsTouMing && bLayerIsTouMing &&
            !(  aLayer.frame.x <= bLayer.frame.x &&
                aLayer.frame.y <= bLayer.frame.y &&
                aLayer.frame.x + aLayer.frame.width >= bLayer.frame.x+bLayer.frame.width &&
                aLayer.frame.y + aLayer.frame.height >= bLayer.frame.y + bLayer.frame.height
            )
        ) {
            return -1;
        }

        //  a b都透明的时候 b完全覆盖a 则替换排序
        if (aLayerIsTouMing && bLayerIsTouMing &&
            (  aLayer.frame.x >= bLayer.frame.x &&
                aLayer.frame.y >= bLayer.frame.y &&
                aLayer.frame.x + aLayer.frame.width <= bLayer.frame.x+bLayer.frame.width &&
                aLayer.frame.y + aLayer.frame.height <= bLayer.frame.y + bLayer.frame.height
            )
        ) {
            return -1;
        }

        return 0;
    });

    layers = layers.map((layer:SKLayer) => {
        if (Array.isArray(layer.layers)) {
            layer.layers = handleNotFillLayerOrder(layer.layers);
        }
        return layer;
    });

    return layers;
}

export default handleNotFillLayerOrder;
