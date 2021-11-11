
import { DSL } from './types';
import {
    handleSpanGroup,
    handleLabelList,
    handleMergeItem
} from './IdentifyLayout';

import handleLayer from './handleLayer';
import handleCascading from './handleCascading';
import recombine from './recombine';

import formatData from './formatData';
import domFormat from './domFormat';
import handleRow from './handleRow';
import styleFix from './styleFix';

// import * as fs from 'fs';

/**
 * 处理单层图层结构
 */
export default ( dsl: DSL ) => {
    let { baseJson, cascadingJson } = handleCascading(dsl[0]);
    // console.log('12222', JSON.stringify(layer))
    [ baseJson, cascadingJson] = [baseJson,cascadingJson].map(dsl=>{
        if (dsl.length===0) {
            return []
        }
        // 格式化
        // dsl = formatData(dsl);
        // 结构处理 方案1 
        // dsl = domFormat(dsl);
        // fs.writeFileSync('./code_dsl_91.json',JSON.stringify(dsl,null,2));
        // 结构处理 方案2
        dsl = recombine(dsl);
        // fs.writeFileSync('./code_dsl_92.json',JSON.stringify(dsl,null,2));
        // 行列处理
        dsl = handleRow(dsl);
        // fs.writeFileSync('./code_dsl_93.json',JSON.stringify(dsl,null,2));
        // 列合并
        dsl = handleSpanGroup(dsl);
        // fs.writeFileSync('./code_dsl_94.json',JSON.stringify(dsl,null,2));
        // 多label标签识别
        dsl = handleLabelList(dsl);
        // fs.writeFileSync('./code_dsl_95.json',JSON.stringify(dsl,null,2));
        // 同一行中依据元素的聚合特性进行合并
        dsl = handleMergeItem(dsl);
        // fs.writeFileSync('./code_dsl_96.json',JSON.stringify(dsl,null,2));
        // 处理冗余结构
        dsl = handleLayer(dsl);
        // fs.writeFileSync('./code_dsl_97.json',JSON.stringify(dsl,null,2));
        // 样式修正处理
        dsl = styleFix(dsl);

        return dsl;
    })

    // fs.writeFileSync('./code_dsl_98.json',JSON.stringify(baseJson,null,2));
    if (Array.isArray(cascadingJson)&&cascadingJson.length>0) {
        // 弹窗
        cascadingJson =cascadingJson.map(item => {
          item.isPosition = true;
          return item;
        })
        if (!baseJson[0].children) {
          baseJson[0].children=[];
        }

        baseJson[0].children = [...baseJson[0].children,...cascadingJson];
    }

    return baseJson;
}
