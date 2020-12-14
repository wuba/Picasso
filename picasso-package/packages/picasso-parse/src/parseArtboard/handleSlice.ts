import { Layer } from '../types';

const handleSlice = (layers: Layer[]) => {
    // 子元素为切片
    if (Array.isArray(layers) && layers.length > 0) {
        for (let i = 0; i < layers.length; i++) {
            if (layers[i]._class === 'slice' && layers[i].isVisible) {
                let currSliceFrame = layers[i].frame;
                for (let j = 0; j < layers.length; j++) {
                    if (layers[j]._class !== 'slice' &&
                        layers[j].isVisible &&
                        layers[j].frame
                    ) {
                        let currFrame = layers[j].frame;
                        if (currFrame.x >= currSliceFrame.x &&
                            currFrame.y >= currSliceFrame.y &&
                            currFrame.x + currFrame.width <= currSliceFrame.x + currSliceFrame.width &&
                            currFrame.y + currFrame.height <= currSliceFrame.y + currSliceFrame.height
                        ) {
                            layers[j].isVisible = false;
                        }
                    }
                }
            }
            if (Array.isArray(layers[i].layers)) {
                layers[i].layers = handleSlice(layers[i].layers)
            }
        }
    }

    return layers;
}

export default handleSlice;
