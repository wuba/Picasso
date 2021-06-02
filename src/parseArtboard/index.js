import sketch from 'sketch';
import UI from 'sketch/ui';
import Promise from '@skpm/promise';
import fs from '@skpm/fs';
import { picassoArtboardCodeParse, picassoArtboardOperationCodeParse } from '@wubafe/picasso-parse';
import handleWebCode from './handleCode/handleWebCode';
import handleWeappCode from './handleCode/handleWeappCode';
import handleRNCode from './handleCode/handleRNCode';
import getImageLayers from './getImageLayers';

/**
 * 画板解析
 * @param {*} type
 *
 */
export const parseArtboard = (artboardItem,codeType, progressSlice, getProgress, rootPath) => new Promise((resolve, reject) => {
    // 未解析，则走解析流程
    const symbolInstanceIds = [];
    // 字体存储
    const fontMap = {};
    const symbolGroups = [];
    // 代码解析图片处理存储
    const codeImageMap = {};
    const d1 = new Date().valueOf();
    // console.log('解析图片开始：', d1, artboardItem.frame.width);
    const sliceSize = 750 === artboardItem.frame.width ? 4 : 2;
    const sliceList = getImageLayers(artboardItem.layers, symbolInstanceIds, fontMap, symbolGroups, codeImageMap, rootPath, sliceSize);
    // console.log('fontMap', fontMap);
    const d2 = new Date().valueOf();
    // console.log('解析图片结束：', d2-d1);
    parseDocument.artProgress += progressSlice * 0.7;
    getProgress(parseDocument.artProgress);
    // console.log('画板导出开始：');
    const artboardJSON = sketch.export(artboardItem, { formats: 'json', output: false });
    const d3 = new Date().valueOf();
    // console.log('画板导出结束：', d3-d2);
    parseDocument.artProgress += progressSlice * 0.1;
    getProgress(parseDocument.artProgress);
    let symbolGroupsJSON = [];
    // console.log('symbol导出开始：');

    if (symbolGroups.length > 0) {
        symbolGroupsJSON = sketch.export(symbolGroups, { formats: 'json', output: false });
    }
    const d4 = new Date().valueOf();
    // console.log('symbol导出结束：', d4-d3);

    const _mergeLayer = (layers) => {
        for (let i = 0; i < layers.length; i++) {
            if (symbolInstanceIds.indexOf(layers[i].do_objectID) > -1) {
                layers[i] = JSON.parse(JSON.stringify(symbolGroupsJSON[symbolInstanceIds.indexOf(layers[i].do_objectID)]));
            }

            if (Array.isArray(layers[i].layers)) {
                layers[i].layers = _mergeLayer(layers[i].layers);
            }
        }

        return layers;
    };

    artboardJSON.layers = _mergeLayer(artboardJSON.layers);

    parseDocument.artProgress += progressSlice * 0.1;
    getProgress(parseDocument.artProgress);
    const _handleSlice = (layers,sliceObject) => {
        for (let i = 0; i < layers.length; i++) {
            if (sliceObject[layers[i].do_objectID]) {
                // 不是原始切片的图层以image的方式处理
                if (layers[i]._class !== 'slice') {
                    layers[i]._class = 'image';
                }

                layers[i].isFlippedHorizontal = false;
                layers[i].isFlippedVertical = false;
                layers[i].style = {
                    _class: 'style',
                    borderOptions: {
                        _class: 'borderOptions',
                        isEnabled: true,
                        dashPattern: [],
                        lineCapStyle: 0,
                        lineJoinStyle: 0,
                    },
                    borders: [],
                    colorControls: {
                        _class: 'colorControls',
                        isEnabled: false,
                        brightness: 0,
                        contrast: 1,
                        hue: 0,
                        saturation: 1,
                    },
                    contextSettings: {
                        _class: 'graphicsContextSettings',
                        blendMode: 0,
                        opacity: 1,
                    },
                    fills: [],
                    innerShadows: [],
                    shadows: [],
                }

                layers[i].layers = [];
                layers[i].imageUrl = sliceObject[layers[i].do_objectID];

            }

            if (Array.isArray(layers[i].layers)) {
                layers[i].layers = _handleSlice(layers[i].layers,sliceObject);
            }
        }

        return layers;
    };

    // 字体补充
    const _handleFont = (layers,fontObject) => {
        for (let i = 0; i < layers.length; i++) {

            // 仅限只有一段文本的情况，多段文本不处理
            if (fontObject[layers[i].do_objectID]
                &&layers[i].attributedString?.attributes?.length===1
                &&layers[i].attributedString?.attributes[0]?.attributes?.MSAttributedStringFontAttribute?.attributes
            ) {
                // console.log('fontObject[layers[i].do_objectID]', fontObject[layers[i].do_objectID]);
                layers[i].attributedString.attributes[0].attributes.MSAttributedStringFontAttribute.attributes.name = fontObject[layers[i].do_objectID];
            }

            if (Array.isArray(layers[i].layers)) {
                layers[i].layers = _handleFont(layers[i].layers,fontObject);
            }
        }

        return layers;
    };

    // 处理代码模式图片
    const _handleCodeImage = (layers, codeImageMap) => {
        for (let j = 0; j < layers.length; j++) {
            if (codeImageMap[layers[j].do_objectID]) {
                layers[j].frame = { ...layers[j].frame, ...codeImageMap.frame};
            }

            if (Array.isArray(layers[j].layers)) {
                layers[j].layers = _handleCodeImage(layers[j].layers, codeImageMap);
            }
        }

        return layers;
    };
    const sliceObject = {};

    sliceList.forEach((item)=>{
        if (!sliceObject[item.id]) {
            sliceObject[item.id] = 'imageUrl';
        }
    });
    artboardJSON.imageUrl = 'imageUrl';

    // 图片处理
    artboardJSON.layers = _handleFont(artboardJSON.layers, fontMap);

    // 切片处理
    artboardJSON.layers = _handleSlice(artboardJSON.layers, sliceObject);

    // 切片尺寸处理
    artboardJSON.layers = _handleCodeImage(artboardJSON.layers, codeImageMap);

    // 代码DSL
    const codeDSL = codeType===1 ? picassoArtboardOperationCodeParse(JSON.parse(JSON.stringify(artboardJSON))) : picassoArtboardCodeParse(JSON.parse(JSON.stringify(artboardJSON)));

    // 图片map
    const imageMap = {};

    // 处理DSL图片
    const _handleDSLImageUrl = (layers) => {
        for (let j = 0; j < layers.length; j++) {
            if (!imageMap[layers[j].id] && sliceObject[layers[j].id]) {
                imageMap[layers[j].id] = 'imageUrl';
            }

            if (Array.isArray(layers[j].children)) {
                _handleDSLImageUrl(layers[j].children);
            }
        }

        return layers;
    };

    _handleDSLImageUrl(codeDSL.children);

    const realSliceList = [];
    sliceList.forEach(item => {
        if(imageMap[item.id] === 'imageUrl') {
            realSliceList.push(item);
        }
    })

    // 设置图片url
    const _setImageUrl = (layers, imgMap) => {
        for (let j = 0; j < layers.length; j++) {
            if (imgMap[layers[j].id] && layers[j].value === 'imageUrl') {
                // 1. 图片url进行替换
                layers[j].value = imgMap[layers[j].id];
                // 2. 如果是背景图，需要对背景图url进行替换
                if (layers[j].style?.background?.image?.url) {
                    layers[j].style.background.image.url = imgMap[layers[j].id];
                }
            }

            if (Array.isArray(layers[j].children)) {
                layers[j].children = _setImageUrl(layers[j].children, imgMap);
            }
        }

        return layers;
    };

    console.log('realSliceList', realSliceList);

    const realSliceObject = {};
    // 多余图片删除处理
    // 1.创建新图片文件夹
    const imagesDir = `${rootPath}/images`;

    // 创建根目录
    if (!fs.existsSync(rootPath)) {
        fs.mkdirSync(rootPath);
    }

    // 创建图片文件夹
    if (!fs.existsSync(imagesDir)&&realSliceList.length>0) {
        fs.mkdirSync(imagesDir);
    }

    realSliceList.forEach(({ id, imageLocalPath }) => {
        // 2.有用的图片复制过去
        if (!fs.existsSync(`${rootPath}/images/${imageLocalPath}`)) { 
            fs.copyFileSync(`${rootPath}/imgs/${imageLocalPath}`,`${rootPath}/images/${imageLocalPath}`);
        }
        realSliceObject[id] = imageLocalPath;
    });
    if (fs.existsSync(`${rootPath}/imgs`)) {
        // 3.删除无用图片目录
        fs.rmdirSync(`${rootPath}/imgs`);
    }
    
    codeDSL.children = _setImageUrl(codeDSL.children, realSliceObject);

    console.log('codeDSL', JSON.stringify(codeDSL));
    // 小程序
    if(codeType === 2) {
        handleWeappCode(rootPath, codeDSL);
    // RN
    } else if(codeType === 3) {
        handleRNCode(rootPath, codeDSL);
    // web代码生成
    } else {
        handleWebCode(rootPath, codeDSL);
    }

    parseDocument.artProgress += progressSlice * 0.05;
    getProgress(parseDocument.artProgress);
    resolve({id: codeDSL.id, name: codeDSL.name.replace(/\//g, '／')});
});

/**
 * 画板解析迭代器
 * @param {*} parseInfo
 * @param {*} artboardList
 * @param {*} progressSlice
 * @param {*} getProgress
 * @param {*} sliceSize
 */
export const parseArtboardIterator = (artboardList,codeType, progressSlice, getProgress, sliceSize, rootPath) => new Promise((resolve, reject) => {
    const results = [];
    const _nextPromise = (index, _artboardList) => {
        if (parseDocument.isCancel) {
            reject();
        } else {
            // 全部画板解析任务完成
            if (index >= _artboardList.length) {
                resolve(results);
            }

            parseArtboard(_artboardList[index],codeType,progressSlice/_artboardList.length, getProgress, sliceSize, rootPath).then((res) => {
                results.push(res);
                _nextPromise(index + 1, _artboardList);
            }).catch((err) => {
                reject(err);
            });
        }
    };

    _nextPromise(0, artboardList);
});

/**
 * 文档解析
 * @param {*} type 1 选中 2 all
 *
 */
export const parseDocument = (type,codeType, rootPath, getProgress = () => {}) => new Promise((resolve, reject) => {

    // 重置参数
    parseDocument.artProgress = 0;
    getProgress(parseDocument.artProgress);

    const d01 = new Date().valueOf();
    // 获取当前文档
    const document = sketch.getSelectedDocument();
    let artboards = [];
    // 当前选中的画板;
    if (type === 1) {
        artboards = document.selectedLayers.layers.filter(layer => layer.type === 'Artboard');
    } else {
        document.pages.forEach((layer) => {
            artboards = [...artboards, ...layer.layers.filter(item => item.type === 'Artboard')];
        });
    }
    // console.log('获取画板时间:', d01, new Date().valueOf() - d01);

    if (artboards.length === 0) {
        return UI.message('请选择画板！');
    }

    if (type === 1) {
        UI.message('解析选中画板');
    } else {
        UI.message('解析全部画板');
    }

    parseDocument.artProgress = 0.019;
    getProgress(parseDocument.artProgress);
    // 画板解析进度分配
    let progressArtboardSlice = 0.98;
    parseArtboardIterator(artboards,codeType, progressArtboardSlice, getProgress, rootPath).then((res) => {
        // console.log('解析完成,结果如下:', res);
        getProgress(1);
        resolve(res);
    }).catch((err) => {
        reject(err);
    });
});

// 解析进度
parseDocument.artProgress = 0;
// 取消标识
parseDocument.isCancel = false;
