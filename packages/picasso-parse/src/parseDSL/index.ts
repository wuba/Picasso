import { DSL, Component, SKLayer } from '../types';
import parseText from './parseText';
import parseStructure from './parseStructure';
import parseStyle from './parseStyle';
import parseImage from './parseImage';
import handleSlicePosition from './handleSlicePosition';
import filterGroupLayer from './filterGroupLayer';

// import * as fs from 'fs';

const _parseDSL = (sketchData: SKLayer[], type: string):DSL => {
    const dsl: DSL=[];
    sketchData.forEach((layer: SKLayer) => {
        let dslLayer: Component = {
            type: 'Container',
            id: layer.do_objectID,
            name: layer.name,
            symbolName: layer.symbolName || '',
            groupBreadcrumb: layer.groupBreadcrumb || []
        }

        // 稳定 ID / 内容指纹透传（annotateStableIds 注入后才存在）。
        // 必须条件写入：源字段缺失时不落 key，保证未注入的老输入产出逐字节不变（向后兼容护栏）
        if (layer.stableId !== undefined) {
            dslLayer.stableId = layer.stableId;
        }
        if (layer.contentHash !== undefined) {
            dslLayer.contentHash = layer.contentHash;
        }
        if (layer.subtreeHash !== undefined) {
            dslLayer.subtreeHash = layer.subtreeHash;
        }
        if (layer.styleHash !== undefined) {
            dslLayer.styleHash = layer.styleHash;
        }

        // 海葵组件
        if (type === 'lowcode') {
            dslLayer.type = 'View';
        }

        // 组件跳转信息
        if (layer.symbolComponentObject) {
            dslLayer.symbolComponentObject = layer.symbolComponentObject;
        }

        // 被解绑的组件
        if (layer.haikuiComponentInfo) {
            dslLayer.haikuiComponentInfo = layer.haikuiComponentInfo;
        }

        // 面板解析
        dslLayer.panel = layer.panel;
        // 结构解析
        dslLayer.structure = { ...dslLayer.structure, ...parseStructure(layer) };
        // 样式解析
        dslLayer.style = { ...dslLayer.style, ...parseStyle(layer) };
        // fs.writeFileSync(`./${layer.name}_code_dsl.json`, JSON.stringify(dslLayer.style,null,2));

        // 文本处理
        dslLayer = parseText(dslLayer,layer)
        // 图片处理
        dslLayer = parseImage(dslLayer,layer,type)

        if (dslLayer.type !=='Text' && Array.isArray(layer.layers)) {
            dslLayer.children = _parseDSL(layer.layers,type);
        }

        dsl.push(dslLayer);
    })

    return dsl;
}

export default (sketchData: SKLayer[], type: string): DSL => {
    const layers: SKLayer[] = [];
    for (let i = 0; i < sketchData.length; i++) {
        const layer = sketchData[i];

        // 面包屑条目条件携带 stableId（组会被拍平不成节点，面包屑是被压 group 稳定 ID 的唯一存身处）
        const rootCrumb: { id: string; name: string; stableId?: string } = { id: layer.do_objectID, name: layer.name };
        if (layer.stableId !== undefined) {
            rootCrumb.stableId = layer.stableId;
        }
        layer.groupBreadcrumb = [rootCrumb];
        // 去掉分组
        layer.layers = filterGroupLayer(layer.layers, [], type, [rootCrumb]);
        // 标注模式下，切片进行排序
        if (type === 'measure') {
            layer.layers = handleSlicePosition(layer.layers);
        }

        layers.push(layer);
    }

    return _parseDSL(layers, type);
};
