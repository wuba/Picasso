const fs = require('fs');
const path = require('path');
const child = require('child_process');
const {
    sketchtoolPath,
    homedir
} = require('../../common/path')

/**
 *  导出图层截切前的形状
 * @param {*} sketchPath sketch 文件绝对路径
 * @param {*} layerId 图层 object_id
 * @param {*} parentId 图层父元素Id
 * 
 */

const exportFullSlice = (sketchPath, imgInfoList) => {
    const cliShapePath = global.globalPath.cliShapePath;
    const filePath = `${homedir}/Library/Application\ Support/com.bohemiancoding.sketch3/Plugins/picassoImg.sketchplugin/Contents/Sketch/picassoImg.js`
    let data = fs.readFileSync(path.resolve(__dirname, 'exportFullSliceTemplate.js'), 'utf-8')
    let fileCon = data
        .replace('$sketchPath$', sketchPath)
        .replace('$shapePath$', cliShapePath)
        .replace('$layerIds$', imgInfoList.map(item => item.layerId).join('|'))
        .replace('$parentIds$', imgInfoList.map(item => item.parentId).join('|'))
        .replace('$parentLists$', imgInfoList.map(item => item.parentList).join('|'));
    fs.writeFileSync(filePath, fileCon, 'utf-8');
    child.execSync(`${sketchtoolPath} run ${homedir}/Library/Application\\ Support/com.bohemiancoding.sketch3/Plugins/picassoImg.sketchplugin ""`)
}

module.exports = async (sketchPath, imgInfoList) => {
    const cliShapePath = global.globalPath.cliShapePath;
    return new Promise((resolve, reject) => {
        try {
            for (let i = 0; i < imgInfoList.length; i++) {
                const layerId = imgInfoList[i].layerId.split('_')[0];
                let slicePath = `${cliShapePath}/${layerId}.png`;
                if (fs.existsSync(slicePath)) {
                    fs.unlinkSync(slicePath);
                }
            }
            exportFullSlice(sketchPath, imgInfoList);
            let timer = setInterval(() => {
                let flag = true;
                for (let i = 0; i < imgInfoList.length; i++) {
                    const layerId = imgInfoList[i].layerId.split('_')[0];
                    let slicePath = `${cliShapePath}/${layerId}.png`;
                    if (!fs.existsSync(slicePath)) {
                        flag = false;
                    }
                }
                if (flag) {
                    clearInterval(timer);
                    resolve(true);
                }
            }, 2000);
        } catch (error) {
            console.log(error);
            reject(false);
        }

    })

}
