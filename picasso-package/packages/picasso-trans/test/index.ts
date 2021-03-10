import * as fs from 'fs';
import * as path from 'path';

import codeDsl from './code_dsl';
import { WebScale, Unit, ColorFormat, CodeType, IOSScale, AndroidScale } from '../src/types';
// 引入包
import {
    picassoTrans,
    colorTrans,
    decodeMeatureTrans,
    decodeCodeTrans,
} from '../src';
// 例子01:
// 解码标注数据
const codeTranDsl = decodeMeatureTrans(codeDsl);
// const dsl = decodeCodeTrans(codeDsl);
// fs.writeFileSync(path.join(__dirname,'./code_trans_dsl2.json'), JSON.stringify(dsl,null,2));
console.log('标注数据解码完成!');
fs.writeFileSync(path.join(__dirname,'./code_trans_dsl.json'), JSON.stringify(codeTranDsl,null,2));

// 颜色转换
// 例子02: 

// 输入:
// {
//     red: 251,
//     green: 128,
//     blue: 52,
//     alpha: 1
// }
// 输出
// [ 
//     {type: 'HEX', value: '#FB8034', alpha: '100%' },
//     { type: 'AHEX', value: '#FFFB8034' },
//     { type: 'HEXA', value: 'fb8034FF' },
//     { type: 'RGBA', value: '251,128,52,1' },
//     { type: 'HSLA', value: '23,96%,59%,1' }
// ]
// 颜色转换
// const color = colorTrans({red: 251, green: 128, blue: 52, alpha: 1});
// console.log('颜色转换输出结果:', color);
// ;(async () => {
//     const dsl = codeTranDsl;
//     // web 标注代码
//     const webDSL = picassoTrans(dsl, {
//         scale: WebScale.Points,
//         unit: Unit.WebPx,
//         colorFormat: ColorFormat.RGBA,
//         codeType: CodeType.WebPx,
//     });
//     fs.writeFileSync(path.join(__dirname,`./web_dsl.json`), JSON.stringify(webDSL,null,2));

//     // 小程序 标注代码
//     const weappDSL = picassoTrans(dsl,{
//         scale: WebScale.Points/2,
//         unit: Unit.Weapp,
//         colorFormat: ColorFormat.RGBA,
//         codeType: CodeType.Weapp,
//     });
//     fs.writeFileSync(path.join(__dirname,`./weapp_dsl.json`), JSON.stringify(weappDSL,null,2));

//     // rn 标注代码
//     const rnDSL = picassoTrans(dsl,{
//         scale: WebScale.Points,
//         unit: Unit.ReactNative,
//         colorFormat: ColorFormat.RGBA,
//         codeType: CodeType.ReactNative,
//     });
//     fs.writeFileSync(path.join(__dirname,`./rn_dsl.json`), JSON.stringify(rnDSL,null,2));

//     // web 标注代码 rem模式
//     const webRemDSL = picassoTrans(dsl,{
//         scale: 100, // rem 基础值设置为100
//         unit: Unit.WebRem,
//         colorFormat: ColorFormat.RGBA,
//         codeType: CodeType.WebRem,
//     });
//     fs.writeFileSync(path.join(__dirname,`./webrem_dsl.json`), JSON.stringify(webRemDSL,null,2));

//     // IOS 标注代码
//     const IOSDSL = picassoTrans(dsl,{
//         scale: IOSScale.Points,
//         unit: Unit.IOS,
//         colorFormat: ColorFormat.RGBA,
//         codeType: CodeType.IOS,
//     });
//     fs.writeFileSync(path.join(__dirname,`./ios_dsl.json`), JSON.stringify(IOSDSL,null,2));

//     // Android 标注代码
//     const AndroidDSL = picassoTrans(dsl, {
//         scale: AndroidScale.HDPI,
//         unit: Unit.Android,
//         colorFormat: ColorFormat.RGBA,
//         codeType: CodeType.Android,
//     });
//     fs.writeFileSync(path.join(__dirname,`./android_dsl.json`), JSON.stringify(AndroidDSL,null,2));

// })()
