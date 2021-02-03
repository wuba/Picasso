import { DSL, Component, SKLayer } from '../types';
import parseText from './parseText';
import parseStructure from './parseStructure';
import parseStyle from './parseStyle';
import parseImage from './parseImage';

import filterGroupLayer from './filterGroupLayer';

const _parseDSL = (sketchData: SKLayer[]):DSL => {
    const dsl: DSL=[];
    sketchData.forEach((layer: SKLayer) => {
        let dslLayer: Component = {
            type: 'Container',
            id: layer.do_objectID,
            name: layer.name,
            symbolName: layer.symbolName || ''
        }

        // 面板解析
        dslLayer.panel = layer.panel;
        // 结构解析
        dslLayer.structure = { ...dslLayer.structure, ...parseStructure(layer) };
        // 样式解析
        dslLayer.style = { ...dslLayer.style, ...parseStyle(layer) };
        // 文本处理
        dslLayer = parseText(dslLayer,layer)
        // 图片处理
        dslLayer = parseImage(dslLayer,layer)

        if (dslLayer.type !=='Text' && Array.isArray(layer.layers)) {
            dslLayer.children = _parseDSL(layer.layers);
        }

        dsl.push(dslLayer);
    })

    return dsl;
}

export default (sketchData: SKLayer[]): DSL => {
    const layers: SKLayer[] = [];
    
    for (let i = 0; i < sketchData.length; i++) {
        let layer = sketchData[i];
        layer.layers = filterGroupLayer(layer.layers);
        layers.push(layer);
    }
    const dsl = _parseDSL(layers);

    return dsl;
};
