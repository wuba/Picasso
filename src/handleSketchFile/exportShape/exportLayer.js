const fs = require('fs');
const path = require('path');
const child = require('child_process');
const {
    sketchtoolPath,
    homedir
} = require('../../common/path')
/**
 *  导出不规则图形的图层
 * 
 * @param {*} sketchPath sketch 文件绝对路径
 * @param {*} artboardId 画板 object_id
 * @param {*} exportImgPath 图片导出绝对路径
 * @param {*} exportLayerList 需要导出的画板 object_id 数组
 */

module.exports = (sketchPath, artboardId, exportImgPath, exportLayerList) => {
    const filePath = `${homedir}/Library/Application\ Support/com.bohemiancoding.sketch3/Plugins/picassoImg.sketchplugin/Contents/Sketch/picassoImg.js`
    let data = fs.readFileSync(path.resolve(__dirname, 'pluginTemplate.js'), 'utf-8')

    let fileCon = data
        .replace('$sketchPath$', sketchPath)
        .replace('$artboardId$', artboardId)
        .replace('$path$', exportImgPath)
        .replace('$exportLayerList$', JSON.stringify(exportLayerList))

    fs.writeFileSync(filePath, fileCon, 'utf-8')

    child.execSync(`${sketchtoolPath} run ${homedir}/Library/Application\\ Support/com.bohemiancoding.sketch3/Plugins/picassoImg.sketchplugin ""`)
}
