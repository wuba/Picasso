import * as path from 'path'
import * as fs from 'fs'
import { picassoCode } from '../src'
const dsl = require('./code_dsl.json')

import { picassoTrans } from '../../picasso-trans/src';
import { WebScale, Unit, ColorFormat, CodeType } from '../../sketch-dsl/src';

const layers = [dsl]

//4. web代码生成
const code = picassoCode(layers, 750, CodeType.WebPx);
// console.log('code', code);
//5. weapp代码生成
const code1 = picassoCode([layers[0].children[0].children[0]], 750, CodeType.Weapp);
// console.log('code1', code1);
//6. rn代码生成
const code2 = picassoCode([layers[0].children[0].children[0]], 750, CodeType.ReactNative);
// console.log('code2', code2);

// 代码模式编辑器使用
const data = picassoTrans(layers, {
    scale: WebScale.Points,
    unit: Unit.WebPx,
    colorFormat: ColorFormat.RGBA,
    codeType: CodeType.WebPx,
});
// 代码模式编辑器使用
// fs.writeFileSync('./code_dsl_1.json', JSON.stringify(data,null,2));

const deepClone = (obj, weakMap= new WeakMap)=>{
    if(obj == null) return obj;
    if(typeof obj !== obj) return obj;
    const cloneObj =  new obj.constructor;
    weakMap.set(obj,cloneObj);
    for(let key in obj){
      if(obj.hasOwnProperty(key)){
        cloneObj[key] = deepClone(obj[key]);
      }
  }
    return cloneObj;
  }
