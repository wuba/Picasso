import { Layer } from '../types';
import { parsePanel } from '../parsePanel';

export const handlePanel = (layers: Layer[]) => {
    for (let i = 0; i < layers.length; i++) {
        layers[i].panel = parsePanel(layers[i]);
        if (Array.isArray(layers[i].layers)) {
            layers[i].layers = handlePanel(layers[i].layers);
        }
    }
    return layers;
}
