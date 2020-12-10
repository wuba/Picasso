import { Style,SKLayer } from '../../types';
import parseFill from './parseFill';
import parseShadow from './parseShadow';
import parseBorderRadius from './parseBorderRadius';
import parseBackGroundColor from './parseBackGroundColor';

const parseStyle = (layer: SKLayer):Style => ({
    ...parseShadow(layer),
    borderRadius: parseBorderRadius(layer),
    background: {
        ...parseBackGroundColor(layer),
        ...parseFill(layer),
    }
})

export default parseStyle;
