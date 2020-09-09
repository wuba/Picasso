const fs = require('fs');
const Md5 = require('md5');
const {
    clearDir,
} = require('../../../common/fsTools');

/**
 * 图片重命名
 *
 * @param {Object} data
 * @param {String} sketchId 
 * @param {String} artboardIndex
 * @returns
 */

const handleImgName = async (data, sketchId, artboardIndex, sendCDN = 2) => {
    if (!data.layers) return [];
    const cliHandleImageDir = global.globalPath.cliHandleImageDir;
    let imageDirPath = `${global.globalPath.cliSketchParseResultPath}/${sketchId}_${artboardIndex}/images/`;
    // 待处理图片文件夹
    for (let j = 0; j < data.layers.length; j++) {
        let layer = data.layers[j];
        if (layer.image && layer.image._ref) {
            let imageOldPath = layer.image._ref.split('images\/')[1];
            let imageNewPath = '';
            if (global.imgNumObj[imageOldPath]) {//已存在则不再改名
                imageNewPath = global.imgNumObj[imageOldPath];
            } else {//不存在则进行修改
                //PDF文件转换为PNG
                if (/\.pdf$/.test(imageOldPath)) {
                    //文件名发生变化
                    imageOldPath = imageOldPath.slice(0, -4) + '.png';
                }
                if (fs.existsSync(imageDirPath + imageOldPath)) {
                    //通过md5值命名
                    let md5 = Md5(fs.readFileSync(imageDirPath + imageOldPath));
                    imageNewPath = `picasso_${md5}.png`;
                    if (!fs.existsSync(cliHandleImageDir + imageNewPath)) {
                        fs.copyFileSync(imageDirPath + imageOldPath, cliHandleImageDir + imageNewPath);
                    }
                    global.imgNumObj[imageOldPath] = imageNewPath;
                    fs.renameSync(imageDirPath + imageOldPath, imageDirPath + imageNewPath);
                }
            }
            layer.image._ref = `images\/` + imageNewPath;
        }
        if (Array.isArray(layer.layers)) {
            await handleImgName(layer, sketchId, artboardIndex, sendCDN);
        }
    }
}
module.exports = async (data, sketchId, artboardIndex, sendCDN) => {
    global.imgNumObj = {};
    global.imgNum = 0;
    // 创建暂存图片文件夹
    clearDir(global.globalPath.cliHandleImageDir);
    await handleImgName(data, sketchId, artboardIndex, sendCDN);
    return data;
};
