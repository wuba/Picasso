import { SKLayer, Component } from './types';
import parseDSL from './parseDSL';
import parseArtboardLayer from './parseArtboard';
import handleClassName from './handleClassName';
import operationLayout from './operationLayout';
import picassoGroup from '../../picasso-group/src';
import picassoLayout from '../../picasso-layout/src';

// import * as fs from 'fs';

/**
 * @description Picasso 画板标注解析方法
 * @param { SKLayer } layer 当前图层
 * @returns { Promise<DSL> }
 * 
 */
export const picassoArtboardMeatureParse = (layer: SKLayer): Component => {
    // 画板处理
    layer = parseArtboardLayer(layer, 'measure');
    // DSL处理
    const DSL = parseDSL([layer], 'measure');
    // fs.writeFileSync('./meature_dsl_result.json',JSON.stringify(DSL,null,2));

    return DSL[0];
}

/**
 * @description Picasso 画板代码解析方法
 * @param { SKLayer } layer 当前图层
 * @returns { Promise<DSL> }
 * 
 */
export const picassoArtboardCodeParse = (layer: SKLayer): Component => {
    // fs.writeFileSync('./code_dsl_1.json',JSON.stringify(layer,null,2));
    // 画板处理
    layer = parseArtboardLayer(layer, 'code');
    // fs.writeFileSync('./code_dsl_2.json',JSON.stringify(layer,null,2));
    // 1.DSL处理
    let DSL = parseDSL([layer], 'code');
    // fs.writeFileSync('./code_dsl_3.json',JSON.stringify(DSL,null,2));
    // 2. 特征分组
    DSL = picassoGroup(DSL);
    // fs.writeFileSync('./code_dsl_4.json',JSON.stringify(DSL,null,2));
    // 3. 布局处理
    DSL = picassoLayout(DSL);
    // fs.writeFileSync('./code_dsl_5.json',JSON.stringify(DSL,null,2));
    // 4. 添加className
    DSL = handleClassName(DSL);
    // fs.writeFileSync('./code_dsl_6.json',JSON.stringify(DSL,null,2));
    return DSL[0];
}

/**
 *
 * @description Picasso运营版代码生成
 * @param { SKLayer } layer 当前图层
 * @returns { Promise<DSL> } 
 * 
 */
export const picassoArtboardOperationCodeParse = (layer: SKLayer): Component => {
    // 画板处理
    layer = parseArtboardLayer(layer, 'code');
    // 1.DSL处理
    let DSL = parseDSL([layer], 'code');
    // 2. 运营版布局
    DSL = operationLayout(DSL);
    // 3. 添加className
    DSL = handleClassName(DSL);
    return DSL[0];
}

/**
 * @description Picasso Lowcode-海葵组件
 * @param { SKLayer } layer 当前图层
 * @returns { Promise<DSL> } 
 */
export const picassoArtboardLowcodeParse = (layer: SKLayer): Component => {
    // 画板处理
    layer = parseArtboardLayer(layer, 'lowcode');
    // 1.DSL处理
    let DSL = parseDSL([layer], 'lowcode');
    // 2. 特征分组
    DSL = picassoGroup(DSL);
    // 3. 布局处理
    DSL = picassoLayout(DSL);
    // fs.writeFileSync('./lowcode_dsl.json',JSON.stringify(DSL,null,2));

    return DSL[0];
}

/**
 * RestoreDSL（结构保真中间表示）解析 + 稳定 ID 注入。
 * 注意：picassoArtboardRestoreParse 签名与上述四个方法不同（三份导出输入），见 README。
 *
 * assessRestoreDiffability：跨版本 diff 前置判定（复制画板检测），服务端 diff 第一步；
 * toRenderProfile：LLM 还原精简视图（剥 hash/组件字典/透明占位，全量产物照常落库）。
 */
export { picassoArtboardRestoreParse, annotateStableIds } from './parseRestoreDSL';
export { assessRestoreDiffability } from './parseRestoreDSL/diffability';
export type { DiffabilityReport, DiffabilityVerdict } from './parseRestoreDSL/diffability';
export { toRenderProfile } from './parseRestoreDSL/renderProfile';
export * from './parseRestoreDSL/restoreTypes';

// 代码生成
export * from '../../picasso-code-browser/src'

// sketch DSL
export * from '../../sketch-dsl/src'
