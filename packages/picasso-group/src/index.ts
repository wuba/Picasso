
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

/**
 * 处理单层图层结构
 */
export default ( dsl: DSL ) => {
    let { baseJson, cascadingJson } = handleCascading(dsl[0]);
    [ baseJson, cascadingJson] = [baseJson,cascadingJson].map(dsl=>{
        if (Object.keys(dsl).length===0) {
            return []
        }
        // 格式化
        dsl = formatData([dsl]);
        // 结构处理 方案1 
        // dsl = domFormat(dsl);
        // 结构处理 方案2
        dsl = recombine(dsl);
        // 行列处理
        dsl = handleRow(dsl);
        // 列合并
        dsl = handleSpanGroup(dsl);
        // 多label标签识别
        dsl = handleLabelList(dsl);
        // 同一行中依据元素的聚合特性进行合并
        dsl = handleMergeItem(dsl);
        // 处理冗余结构
        dsl = handleLayer(dsl);
        // 样式修正处理
        dsl = styleFix(dsl);

        return dsl;
    })

    if (Array.isArray(cascadingJson[0]?.children)) {
        cascadingJson[0].children =cascadingJson[0].children.map(item=>{
          item.isPosition=true;
          return item;
        })
        if (!baseJson[0].children) {
          baseJson[0].children=[];
        }
        baseJson[0].children = [...baseJson[0].children,...cascadingJson[0].children];
    }

    return baseJson;
}
