import { SKLayer } from '../types';

// 切片位置调整
const _handleSlicePosition = (layers: SKLayer[]) => {

    layers.sort((layerA,layerB) => {
        if (layerB._class==='slice'||layerB._class==='image') {
            if (
                layerA.frame.x<=layerB.frame.x
                && layerA.frame.y<=layerB.frame.y
                && layerA.frame.x+layerA.frame.width>=layerB.frame.x+layerB.frame.width
                && layerA.frame.y+layerA.frame.height>=layerB.frame.y+layerB.frame.height
            ) {
                return -1;
            }
        }
        return 0;
    })

    for (let i = 0; i < layers.length; i++) {

        if (Array.isArray(layers[i].layers)) {
            layers[i].layers = _handleSlicePosition(layers[i].layers);
        }
    }

    return layers;
};

export default _handleSlicePosition;
