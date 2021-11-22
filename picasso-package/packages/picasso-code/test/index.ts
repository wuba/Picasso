import * as path from 'path'
import * as fs from 'fs'
import { picassoCode, picassoCodeFile } from '../src'
const dsl = require('./code_dsl.json')

import { picassoTrans } from '../../picasso-trans/src';
import { WebScale, Unit, ColorFormat, CodeType } from '../../sketch-dsl/src';

const layers = [dsl]

//1. web代码生成
picassoCodeFile(layers, path.join(__dirname, './code'), CodeType.WebPx)

//2. weapp代码生成
picassoCodeFile(layers, path.join(__dirname, './code_weapp'), CodeType.Weapp)

//3. rn代码生成
picassoCodeFile(layers, path.join(__dirname, './code_rn'), CodeType.ReactNative)

//4. web代码生成
// const code = picassoCode([layers[0].children[0].children[0]], 750, CodeType.WebPx);
const code = picassoCode(layers, 750, CodeType.WebPx);
console.log('code', code);
// fs.writeFileSync('./test/web_code.json', JSON.stringify(code, null,2));

//5. weapp代码生成
const code1 = picassoCode(layers, 750, CodeType.Weapp);
console.log('code1', code1);
// fs.writeFileSync('./test/weapp_code_dsl.json', JSON.stringify(code1, null,2));

//6. rn代码生成
const code2 = picassoCode(layers, 750, CodeType.ReactNative);
console.log('code2', code2);
// fs.writeFileSync('./test/rn_code_dsl.json', JSON.stringify(code2, null,2));

// 代码模式编辑器使用
const data = picassoTrans(layers, {
    scale: WebScale.Points,
    // unit: Unit.WebPx,
    unit: Unit.WebRem,
    colorFormat: ColorFormat.RGBA,
    // codeType: CodeType.WebPx,
    codeType: CodeType.WebRem,
});
// 代码模式编辑器使用
// fs.writeFileSync('./test/picassoTrans_code_dsl.json', JSON.stringify(data,null,2));
