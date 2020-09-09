const fs = require('fs');
const path = require('path');
const child = require('child_process');
const { sketchtoolPath, homedir } = require('../../common/path')
/**
 *  保存为最新版本
 * 
 * @param {*} sketchPath sketch 文件绝对路径
 * 
 */
module.exports = (sketchPath) => {
    const filePath = `${homedir}/Library/Application\ Support/com.bohemiancoding.sketch3/Plugins/picassoImg.sketchplugin/Contents/Sketch/picassoImg.js`
    let data = fs.readFileSync(path.resolve(__dirname, 'saveVersionTemplate.js'), 'utf-8')
    let fileCon = data.replace('$sketchPath$', sketchPath);
    fs.writeFileSync(filePath, fileCon, 'utf-8');
    child.execSync(`${sketchtoolPath} run ${homedir}/Library/Application\\ Support/com.bohemiancoding.sketch3/Plugins/picassoImg.sketchplugin ""`)
}
