import { SKLayer } from '../types';


const handleOpacity = (layers:SKLayer[],commonOpacity = 1):SKLayer[] => {

    // 透明度传递
    layers = layers.map((layer:SKLayer):SKLayer => {

        if (!layer.style) {
            layer.style = {
                _class: 'style'
            };
        }

        if (!layer.style.contextSettings) {
            layer.style.contextSettings = {
                _class: 'graphicsContextSettings',
                opacity: 1
            };
        }

        layer.style.contextSettings.opacity = layer.style.contextSettings.opacity * commonOpacity;

        if (Array.isArray(layer.layers)) {
            layer.layers = handleOpacity(layer.layers,layer.style.contextSettings.opacity);
        }

        return layer;
    });

    return layers;
}

export default handleOpacity;
