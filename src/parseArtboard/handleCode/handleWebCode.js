import fs from '@skpm/fs';
import { CodeType, picassoCode } from '@wubafe/picasso-parse';

import remjs from './remjs';
import resetcss from './resetcss';

export default (rootPath, codeDSL) => {
    const pageWidth = codeDSL.structure.width;
    const codePath = `${rootPath}/${codeDSL.name.replace(/\//g, '／')}`;
    // 生成代码片段
    const code = picassoCode([codeDSL], pageWidth, CodeType.WebPx);

    if (!fs.existsSync(codePath)) {
        fs.mkdirSync(codePath);
    }

    const title = codeDSL.name;
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
${code.html}
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
${code.html}
    </body>
</html>`;
    const _html = [375,750].includes(pageWidth) ? _html_mobile : _html_pc;
    fs.writeFileSync(`${codePath}/index.html`, _html);
    fs.writeFileSync(`${codePath}/index.scss`, code.scss);
    fs.writeFileSync(`${codePath}/index.css`, code.css);
    fs.writeFileSync(`${codePath}/reset.css`, resetcss);
    if([375,750].includes(pageWidth)) {
        fs.writeFileSync(`${codePath}/rem.js`, remjs);
    }
}
