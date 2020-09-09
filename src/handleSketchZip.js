const fs = require('fs')
const rimraf = require('rimraf')
const zipper = require('zip-local')

module.exports = (sketchId, sketchName, artboardIndex) => {
    /**
     * 解压缩处理
     */
    const cliSketchParseResultPath = global.globalPath.cliSketchParseResultPath
    const zipFilePath = `${cliSketchParseResultPath}/${sketchId}_${artboardIndex}.zip`
    const unzipFolderPath = `${cliSketchParseResultPath}/${sketchId}_${artboardIndex}`

    if (fs.existsSync(zipFilePath)) {
        fs.unlinkSync(zipFilePath)
    }

    if (fs.existsSync(unzipFolderPath)) {
        rimraf.sync(unzipFolderPath)
    }
    fs.copyFileSync(
        `${cliSketchParseResultPath}/${sketchId}_${artboardIndex}.sketch`,
        zipFilePath
    )

    fs.mkdirSync(unzipFolderPath)

    zipper.sync.unzip(zipFilePath).save(unzipFolderPath)
}
