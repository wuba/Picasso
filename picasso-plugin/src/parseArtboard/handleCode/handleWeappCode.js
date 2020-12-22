import fs from '@skpm/fs';
import { CodeType, picassoCode } from '@wubafe/picasso-parse';

import resetwxss from './resetwxss';

export default (rootPath, codeDSL) => {
    const pageWidth = codeDSL.structure.width;
    const codePath = `${rootPath}/${codeDSL.name.replace(/\//g, '／')}`;
    // 生成代码片段
    const code = picassoCode([codeDSL], pageWidth, CodeType.Weapp);

    if (!fs.existsSync(codePath)) {
        fs.mkdirSync(codePath);
    }

    const title = codeDSL.name;
    //wxml模板
    let _wxml = `<block>${code.wxml}</block>`;
    fs.writeFileSync(`${codePath}/index.wxml`, _wxml);
    fs.writeFileSync(`${codePath}/index.wxss`,code.wxss);
    fs.writeFileSync(`${codePath}/reset.wxss`,resetwxss)
}