import { Style,SKLayer } from '../../types';
import parseFill from './parseFill';
import parseShadow from './parseShadow';
import parseBorderRadius from './parseBorderRadius';
import parseBackGroundColor from './parseBackGroundColor';

const parseStyle = (layer: SKLayer):Style => {
    const layerStyle = {
        ...parseShadow(layer),
        background: {
            ...parseBackGroundColor(layer),
            ...parseFill(layer),
        }
    }

    if (layer._class !== 'text') {
        layerStyle.borderRadius = parseBorderRadius(layer)
    }
    
    return layerStyle;
}

export default parseStyle;
