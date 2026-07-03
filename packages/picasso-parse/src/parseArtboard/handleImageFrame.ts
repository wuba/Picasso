
import { SKLayer } from '../types';

// 处理代码模式切片位置
const handleImageFrame = (layers: SKLayer[], codeImageMap: object) => {
    
    if (Object.keys(codeImageMap).length === 0) {
        return layers;
    }

    layers.map((layer:SKLayer): SKLayer => {
        if (codeImageMap[layer.do_objectID]) {
            layer.frame = { ...layer.frame, ...codeImageMap[layer.do_objectID]};
        }

        if (Array.isArray(layer.layers)) {
            layer.layers = handleImageFrame(layer.layers, codeImageMap);
        }

        return layer;
    });

    return layers;
}

export default handleImageFrame;
