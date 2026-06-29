import { SKLayer } from '../types';


const _fixPosition = (layers:SKLayer[], { x, y }):SKLayer[] => {

    // 透明度传递
    layers = layers.map((layer:SKLayer):SKLayer => {
        // x值修正
        layer.frame.x = layer.frame.x - x;
        // y值修正
        layer.frame.y = layer.frame.y - y;

        if (Array.isArray(layer.layers)) {
            layer.layers = _fixPosition(layer.layers,{x,y});
        }

        return layer;
    });

    return layers;
}

export default (layers:SKLayer[]): SKLayer[] => {
    // 基础坐标系
    const { x = 0, y = 0 } = layers[0] && layers[0].frame ? layers[0].frame: { x: 0, y: 0 };

    return _fixPosition(layers, { x, y });
}
