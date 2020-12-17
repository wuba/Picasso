/*
 * @Author: iChengbo
 * @Date: 2020-12-17 10:43:10
 * @LastEditors: iChengbo
 * @LastEditTime: 2020-12-17 14:46:22
 * @FilePath: /Picasso/src/parseArtboard/handleCode/handleRNCode.js
 */
import fs from '@skpm/fs';
import { CodeType, picassoCode } from '@wubafe/picasso-parse';

export default (rootPath, codeDSL) => {
    const pageWidth = codeDSL.structure.width;
    const codePath = `${rootPath}/${codeDSL.name.replace(/\//g, '／')}`;
    // 生成代码片段
    const code = picassoCode([codeDSL], pageWidth, CodeType.ReactNative);

    if (!fs.existsSync(codePath)) {
        fs.mkdirSync(codePath);
    }

    fs.writeFileSync(`${codePath}/index.jsx`, code.jsx);
}
