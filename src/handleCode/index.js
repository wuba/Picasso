const mergeCss = require('./mergeCss');
const generateScss = require('./generateScss');
const generateBody = require('./generateBody');
const nodeSass = require('node-sass');
const fs = require('fs');
const path = require('path');
const {
    PLATFORM
} = require('../common/global');

/**
 * 删除文件夹
 * @param {String} dir 要删除的文件夹
 */
function removeDir(dir) {
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

module.exports = async (data, sketchId, sketchName, artboardIndex, artboardName, platform, size, pageType, classPrefix) => {
    try {
        const cliSketchParseResultPath = global.globalPath.cliSketchParseResultPath;
        // TODO 合并算法可以进一步优化
        data = mergeCss(data);
        // 生成 body
        let body = generateBody(data, pageType, classPrefix);
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
        scss += generateScss(data, platform, size, pageType, classPrefix);

        // 将scss转换为css
        let { css } = nodeSass.renderSync({
            data: scss,
            outputStyle: 'expanded'
        });
        // 开始输出解析结果
        let folderPath = `${cliSketchParseResultPath}/${sketchId}_${artboardIndex}_page`;
        if (fs.existsSync(folderPath)) {
            removeDir(folderPath);
        }
        fs.mkdirSync(folderPath);
        // 写入静态资源
        fs.writeFileSync(`${folderPath}/rem.js`, fs.readFileSync(path.join(__dirname, './rem.js')))
        fs.writeFileSync(`${folderPath}/reset.css`, fs.readFileSync(path.join(__dirname, './reset.css')))
        // 写入生成的样式
        fs.writeFileSync(`${folderPath}/index.css`, css)
        fs.writeFileSync(`${folderPath}/index.scss`, scss)

        // 移动图片位置
        fs.mkdirSync(`${folderPath}/images`)
        const imagesPath = `${cliSketchParseResultPath}/${sketchId}_${artboardIndex}/images`;

        if (fs.existsSync(imagesPath)) {
            let files = fs.readdirSync(imagesPath);
            for (var i = 0; i < files.length; i++) {
                if (files[i].indexOf(`picasso_`) > -1) {
                    // json中有的(说明这个图片被使用到)才复制过去
                    if (JSON.stringify(data).indexOf(files[i].split('picasso_')[1]) > -1) {
                        fs.copyFileSync(`${imagesPath}/${files[i]}`, `${folderPath}/images/${files[i]}`);
                    }
                }
            }
        }
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
    <title>${artboardName}</title>
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
    <title>${artboardName}</title>
    </head>
    <body>
        ${body}
    </body>
    </html>`;

        const _html = platform === PLATFORM.m ? _html_mobile : _html_pc;
        // 生成html文件
        fs.writeFileSync(`${folderPath}/index.html`, _html);

    } catch (error) {
        console.log(error);
    }
}
