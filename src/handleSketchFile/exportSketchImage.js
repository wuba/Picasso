const {
    sketchtoolPath
} = require('../common/path');
const process = require('child_process');

/**
 * 导出画板图片
 */
module.exports = (sketchId, sketchName) => {
    const cliSketchParseResultPath = global.globalPath.cliSketchParseResultPath;
    const cliSketchResourcePath = global.globalPath.cliSketchResourcePath;
    return new Promise((resolve, reject) => {
        process.exec(`rm -rf ${cliSketchParseResultPath}/${sketchId} && mkdir ${cliSketchParseResultPath}/${sketchId} && cp ${cliSketchResourcePath}/${sketchName}.sketch ${cliSketchParseResultPath}/${sketchId}/${sketchName}.sketch && ${sketchtoolPath} export artboards ${cliSketchParseResultPath}/${sketchId}/${sketchName}.sketch --output=${cliSketchParseResultPath}/${sketchId}/artboards --use-id-for-name=YES --group-contents-only=YES --scales=1 --background=#FFF`,
            (err) => {
                err ? reject(err) : resolve({
                    sketchId,
                    sketchName
                });
            });
    })
}
