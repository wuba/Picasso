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
    
    return DSL[0];
}

/**
 * @description Picasso 画板代码解析方法
 * @param { SKLayer } layer 当前图层
 * @returns { Promise<DSL> }
 * 
 */
export const picassoArtboardCodeParse = (layer: SKLayer): Component => {
    // console.log('12222', JSON.stringify(layer))
    // fs.writeFileSync('./code_dsl_1.json',JSON.stringify(layer,null,2));
    // 画板处理
    layer = parseArtboardLayer(layer, 'code');
    // console.log('22222', JSON.stringify(layer))
    // fs.writeFileSync('./code_dsl_2.json',JSON.stringify(layer,null,2));
    // 1.DSL处理
    let DSL = parseDSL([layer], 'code');
    // console.log('32222', JSON.stringify(DSL))
    // fs.writeFileSync('./code_dsl_3.json',JSON.stringify(DSL,null,2));
    // 2. 特征分组
    DSL = picassoGroup(DSL);
    // console.log('42222', JSON.stringify(DSL))
    // fs.writeFileSync('./code_dsl_4.json',JSON.stringify(DSL,null,2));
    // 3. 布局处理
    DSL = picassoLayout(DSL);
    // console.log('52222', JSON.stringify(DSL))
    // fs.writeFileSync('./code_dsl_5.json',JSON.stringify(DSL,null,2));
    // 4. 添加className
    DSL = handleClassName(DSL);
    // console.log('62222', JSON.stringify(DSL))
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

// 代码生成
export * from '../../picasso-code-browser/src'

// sketch DSL
export * from '../../sketch-dsl/src'
