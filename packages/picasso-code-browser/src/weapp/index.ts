import { Layer } from '../types';
import handleClassName from '../handleClassName';
import { picassoTrans } from '../../../picasso-trans/src';
import { WebScale, Unit, ColorFormat, CodeType } from '../../../sketch-dsl/src';
import generateWXML from './generateWXML';
import generateWXSS from './generateWXSS';

/**
 * @description Picasso生成小程序代码
 * @param {Layer[]} data
 * @param { number } size 画板宽度
 */
export const picassoWeappCode = (data:Layer[], size: number) => {
    // class名称处理
    data = handleClassName(data);
    // 样式处理
    data = picassoTrans(data, {
        scale: WebScale.Points,
        unit: Unit.Weapp,
        colorFormat: ColorFormat.RGBA,
        codeType: CodeType.Weapp
    });
    //生成wxml模板
    const wxml = generateWXML(data);
    //生成wxss代码
    const wxss = generateWXSS(data,size);

    return {
        wxml,
        wxss
    }
}
