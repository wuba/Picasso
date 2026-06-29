import { SKLayer, Panel } from '../types';

import { parseProperty } from './parseProperty';
import { parseFill } from './parseFill';
import { parseTypeFace } from './parseTypeFace';
import { parseBorder } from './parseBorder';
import { parseShadow } from './parseShadow';

export const parsePanel = (layer: SKLayer): Panel => {

    return {
        properties: parseProperty(layer),
        fills: parseFill(layer),
        typefaces: parseTypeFace(layer),
        borders: parseBorder(layer),
        shadows: parseShadow(layer),
        code: '',
    }
};
