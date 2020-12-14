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
const code = picassoCode([layers[0].children[0].children[0]], 750, CodeType.WebPx);
console.log('code', code);
//5. weapp代码生成
const code1 = picassoCode([layers[0].children[0].children[0]], 750, CodeType.Weapp);
console.log('code1', code1);
//6. rn代码生成
const code2 = picassoCode([layers[0].children[0].children[0]], 750, CodeType.ReactNative);
console.log('code2', code2);

// 代码模式编辑器使用
const data = picassoTrans(layers, {
    scale: WebScale.Points,
    unit: Unit.WebPx,
    colorFormat: ColorFormat.RGBA,
    codeType: CodeType.WebPx,
});
// 代码模式编辑器使用
fs.writeFileSync('./code_dsl_1.json', JSON.stringify(data,null,2));
