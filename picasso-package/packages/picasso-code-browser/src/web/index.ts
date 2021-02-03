import { Layer } from '../types';
import generateScss from './generateScss';
import generateCSS from './generateCSS';
import generateBody from './generateBody';
import { picassoTrans } from '../../../picasso-trans/src'
;
import { WebScale, Unit, ColorFormat, CodeType } from '../../../sketch-dsl/src';

/**
 * 生成局部代码
 * @description Picasso生成代码
 * @param {Layer[]} data
 * @param {string} outputPath 生成代码存放路径
 */
export const picassoWebCode = (data: Layer[], size: number) => {
    try {
        const platform = [375,750].includes(Math.round(size)) ? 2 : 1;

        // 4. 样式处理
        data = picassoTrans(data, {
            scale: WebScale.Points,
            unit: Unit.WebPx,
            colorFormat: ColorFormat.RGBA,
            codeType: CodeType.WebPx,
        });
        // 生成 body
        const body = generateBody(data, '');
        let scss = '';
        // 生成scss
        scss += generateScss(data, size);
        // 生成css
        const css = generateCSS(data, size, platform);

        return {
            scss,
            css,
            html: body,
            vueHtml: body,
            reactHtml: body.replace(/class=/ig, 'className='),
        }

    } catch (error) {
        console.log(error);
    }
}
