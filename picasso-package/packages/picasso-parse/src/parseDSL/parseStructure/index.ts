
import { Structure,SKLayer } from '../../types';
import parseBorder from './parseBorder';
import { precisionControl } from '../../common/utils'

const parseStructure = (layer: SKLayer):Structure => {
    const { x, y, height, width } = layer.frame;

    return {
        x: precisionControl(x),
        y: precisionControl(y),
        width: precisionControl(width),
        height: precisionControl(height),
        border: parseBorder(layer),
    }
}
export default parseStructure;
