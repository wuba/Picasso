// import * as fs from 'fs'
import { Layer } from '../types';
import generateScss from './generateScss';
import generateCSS from './generateCSS';
import generateBody from './generateBody';
import remjs from './assets/remjs';
import resetcss from './assets/resetcss';
import { picassoTrans } from '../../../picasso-trans/src';
import { WebScale, Unit, ColorFormat, CodeType } from '../../../sketch-dsl/src';

import {
    PLATFORM
} from './const';

/**
 * 生成整个页面代码
 * @description Picasso生成代码
 * @param {Layer[]} data
 * @param {string} outputPath 生成代码存放路径
 */
export const picassoWebCodeFile = (data: Layer[], outputPath: string) => {
    const fs = require('fs');
    const path = require('path');

    /**
     * 删除文件夹
     * @param {String} dir 要删除的文件夹
     */
    const removeDir = (dir: string) => {
        let files = fs.readdirSync(dir)
        for (var i = 0; i < files.length; i++) {
            let newPath = path.join(dir, files[i]);
            let stat = fs.statSync(newPath)
            if (stat.isDirectory()) {
                //如果是文件夹就递归下去
                removeDir(newPath);
            } else {
                //删除文件
                fs.unlinkSync(newPath);
            }
        }
        //如果文件夹是空的，就将自身删除掉
        fs.rmdirSync(dir);
    }

    try {
        const platform = [375,750].includes(Math.round(data[0].structure.width)) ? 2 : 1;
        // TODO 合并算法可以进一步优化

        // 4. 样式处理
        data = picassoTrans(data, {
            scale: WebScale.Points,
            unit: Unit.WebPx,
            colorFormat: ColorFormat.RGBA,
            codeType: CodeType.WebPx,
        });
        // data = mergeCss(data);
        // 生成 body
        const body = generateBody(data,'        ');
        let scss = '';
        // pc 布局单独处理
        if (platform === PLATFORM.pc) {
            scss = `body {
                overflow-x: hidden;
                position: relative;
                height: ${data[0].style['height']}px;
            }`;
        }
        // 生成scss
        scss += generateScss(data,data[0].structure.width);
        // 生成css
        const css = generateCSS(data, data[0].structure.width, platform);

        // 开始输出解析结果
        if (fs.existsSync(outputPath)) {
            removeDir(outputPath);
        }

        fs.mkdirSync(outputPath);

        // 写入静态资源
        fs.writeFileSync(`${outputPath}/rem.js`, remjs)
        fs.writeFileSync(`${outputPath}/reset.css`, resetcss)

        // 写入生成的样式
        fs.writeFileSync(`${outputPath}/index.css`, css);
        fs.writeFileSync(`${outputPath}/index.scss`, scss);
        const title = data[0].name;
        // html mobile模版
        let _html_mobile = `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <link rel="stylesheet" href="./reset.css">
        <link rel="stylesheet" href="./index.css">
        <script src="./rem.js"></script>
        <title>${title}</title>
    </head>
    <body>
${body}
    </body>
</html>`;

        // html pc模版
        let _html_pc = `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <link rel="stylesheet" href="./reset.css">
        <link rel="stylesheet" href="./index.css">
        <title>${title}</title>
    </head>
    <body>
${body}
    </body>
</html>`;

        const _html = platform === PLATFORM.m ? _html_mobile : _html_pc;

        // 生成html文件
        fs.writeFileSync(`${outputPath}/index.html`, _html);

    } catch (error) {
        console.log(error);
    }
}

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
        // fs.writeFileSync('./test/web_code_dsl_1.json', JSON.stringify(data, null,2));

        // 生成 body
        const body = generateBody(data,'');
        // fs.writeFileSync('./test/web_code_body.json', JSON.stringify(body, null,2));

        let scss = '';
        // 生成scss
        scss += generateScss(data,size);
        // fs.writeFileSync('./test/web_code_scss.json', JSON.stringify(scss, null,2));

        // 生成css
        const css = generateCSS(data, size, platform);
        // fs.writeFileSync('./test/web_code_css.json', JSON.stringify(css, null,2));

        return {
            scss,
            css,
            html: body
        }

    } catch (error) {
        console.log(error);
    }
}
