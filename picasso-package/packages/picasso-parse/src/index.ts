import { SKLayer, Component } from './types';
import parseDSL from './parseDSL';
import parseArtboardLayer from './parseArtboard';
import handleClassName from './handleClassName';
import picassoGroup from '../../picasso-group/src';
import picassoLayout from '../../picasso-layout/src';

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
    const DSL = parseDSL([layer]);
    
    return DSL[0];
}

/**
 * @description Picasso 画板代码解析方法
 * @param { SKLayer } layer 当前图层
 * @param { Object } imageFrameMap 当前图层
 * @returns { Promise<DSL> }
 * 
 */
export const picassoArtboardCodeParse = (layer: SKLayer): Component => {
    // 画板处理
    layer = parseArtboardLayer(layer, 'code');
    // 1.DSL处理
    let DSL = parseDSL([layer]);
    // 2. 特征分组
    DSL = picassoGroup(DSL);
    // 3. 布局处理
    DSL = picassoLayout(DSL);
    // 4. 添加className
    DSL = handleClassName(DSL);
    return DSL[0];
}

// 代码生成
export * from '../../picasso-code-browser/src'

// sketch DSL
export * from '../../sketch-dsl/src'
