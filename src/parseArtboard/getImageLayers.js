import sketch from 'sketch';
import sketchDom from 'sketch/dom';
import { isTheClass, find, exportImage, removeLayer, toJSString } from './common';
import handleImage from '../handleImage/index';

// 递归查找需求导出为图片的图层
const _getImageLayers = (layers,symbolInstanceIds, fontMap, symbolGroups, codeImageMap, rootPath, sliceSize, _exportLayers = []) => {
    for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        const SLayer = layer.sketchObject;

        // 字体处理；存储
        if (!fontMap[layer.id] && layer.type === 'Text') {
            /* eslint-disable */
            fontMap[layer.id] = new String(layer.sketchObject?.fontPostscriptName()).toString();
            /* eslint-disable */
        }
        

        // 切片处理
        if (!layer.hidden &&
            (layer.type === 'Slice' ||
            (layer.type === 'SymbolInstance'&&sketchDom.fromNative(SLayer.symbolMaster()).exportFormats?.length > 0) ||
            (layer.type !== 'Artboard' && layer.type !== 'Shape' && layer.exportFormats?.length > 0))
        ) {
            try {
                let trimmed = true;
                let groupContentsOnly = true;

                const layerJson = sketch.export(layer, { formats: 'json', output: false });

                if (layer.type === 'Slice') {
                    const { shouldTrim, layerOptions } = layerJson.exportOptions;

                    trimmed = shouldTrim;
                    groupContentsOnly = +layerOptions === 2;
                }

                const imageLocalPath = exportImage(layer, sliceSize, rootPath, trimmed, groupContentsOnly);

                _exportLayers.push({ id: layer.id, imageLocalPath });
            } catch (error) {
                // console.log('图片导出错误', layer.id, error);
            }
        // 代码模式导出图片
        } else if (!layer.hidden) {
            // console.log('代码模式切片');
            // 判断是否需要做切片处理
            if (handleImage(layer)) {
                // 进行切片
                const sliceLayer = MSSliceLayer.sliceLayerFromLayer(SLayer);
                // 获取切片尺寸
                const sliceFrame = sliceLayer.frame();
                // 注意：导出当前图层
                const imageLocalPath = exportImage(layer, sliceSize, rootPath);

                // 存储切片信息
                codeImageMap[layer.id] = {
                    x: sliceFrame.left(),
                    y: sliceFrame.top(),
                    width: sliceFrame.width(),
                    height: sliceFrame.height(),
                };

                _exportLayers.push({ id: layer.id, imageLocalPath });

                removeLayer(sliceLayer);
            }
        }

        // symbol
        if (
            !layer.hidden &&
            layer.type === 'SymbolInstance' &&
            !(layer.exportFormats?.length > 0) &&
            SLayer.symbolMaster() &&
            !(sketchDom.fromNative(SLayer.symbolMaster()).exportFormats?.length > 0) &&
            SLayer.symbolMaster().children() && SLayer.symbolMaster().children().count() > 1
        ) {
            const symbolChildren = SLayer.symbolMaster().children();
            const tempSymbol = SLayer.duplicate();
            const tempGroup = tempSymbol.detachStylesAndReplaceWithGroupRecursively(true);
            const tempSymbolLayers = tempGroup.children().objectEnumerator();
            let overrides = SLayer.overrides();
            let idx = 0;
            let tempSymbolLayer;

            overrides = (overrides) ? overrides.objectForKey(0) : undefined;
            /* eslint-disable */
            while (tempSymbolLayer = tempSymbolLayers.nextObject()) {
            /* eslint-disable */
                if (isTheClass(tempSymbolLayer, MSSymbolInstance)) {
                    const symbolMasterObjectID = toJSString(symbolChildren[idx].objectID());

                    if (overrides
                        && overrides[symbolMasterObjectID]
                        && !!overrides[symbolMasterObjectID].symbolID
                    ) {
                        const changeSymbol = find({
                            key: '(symbolID != NULL) && (symbolID == %@)',
                            match: toJSString(overrides[symbolMasterObjectID].symbolID),
                        }, document.documentData().allSymbols());

                        if (changeSymbol) {
                            tempSymbolLayer.changeInstanceToSymbol(changeSymbol);
                        } else {
                            tempSymbolLayer = undefined;
                        }
                    }
                }

                idx++;
            }

            symbolInstanceIds.push(layer.id);
            symbolGroups.push(tempGroup);
            if (Array.isArray(sketchDom.fromNative(tempGroup).layers)) {
                _getImageLayers(sketchDom.fromNative(tempGroup).layers, symbolInstanceIds, fontMap, symbolGroups, codeImageMap, rootPath, sliceSize, _exportLayers);
            }

            removeLayer(tempGroup);
        } else if (Array.isArray(layer.layers)) {
            _getImageLayers(layer.layers, symbolInstanceIds, fontMap, symbolGroups, codeImageMap, rootPath, sliceSize, _exportLayers);
        }
    }

    return _exportLayers;
};

export default _getImageLayers;
