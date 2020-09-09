const fs = require('fs');
const path = require('path');
const process = require('child_process');

const { PLATFORM } = require('./global');
const {
    sketchtoolPath
} = require('./path');

module.exports = {
    /**
     *获取sketch版本
     *
     * @param {String} sketchPath
     * @returns {String} version
     */
    getVersionByPath(sketchPath) {
        let rst = process.execSync(`${sketchtoolPath} metadata ${sketchPath}`);
        return JSON.parse(rst.toString()).appVersion;
    },
    /**
     *获取第三方模块列表
     *
     * @param {String} sketchPath
     * @returns {Array} foreignSymbols
     */
    getForeignSymbols(sketchPath) {
        let foreignSymbols = [];
        let doc = process.execSync(`${sketchtoolPath} dump ${sketchPath}`);
        if (Array.isArray(JSON.parse(doc.toString()).foreignSymbols)) {
            foreignSymbols = JSON.parse(doc.toString()).foreignSymbols;
        }
        return foreignSymbols;
    },
    /**
     * 判断是否为sketch文件
     * @param {String} sketchPath
     * @returns {Boolean} isSketch
     */
    isSketchFile(sketchPath) {
        try {
            process.execSync(`${sketchtoolPath} metadata ${sketchPath}`);
            return true;
        } catch (error) {
            return false;
        }
    },
    /**
     * 
     * 获取sketch中的画板列表
     * 
     * @param {String} sketchId
     * @param {String} sketchName
     */
    getArtboardsList(sketchId, sketchName) {
        const artboardsList = [];
        const cliSketchParseResultPath = global.globalPath.cliSketchParseResultPath;
        const artboardsPath = `${cliSketchParseResultPath}/${sketchId}/artboards`;
        function finder(folderPath) {
            const fileList = fs.readdirSync(folderPath);
            let artboardIndex = 0;
            fileList.forEach((val) => {
                let fPath = path.join(folderPath, val);
                let stats = fs.statSync(fPath);
                // 根据artboards预览图拆分成多个sketch;
                if (stats.isFile() && /.png$/.test(fPath)) {
                    artboardIndex++;
                    const uuid = fPath.split(`artboards/`)[1].split('.png')[0];
                    artboardsList.push({
                        sketchId,
                        sketchName,
                        artboardIndex,
                        uuid
                    });
                    // artboard为多层文件夹
                } else if (stats.isDirectory()) {
                    finder(fPath);
                }
            });
            return artboardsList;
        }
        try {
            return finder(artboardsPath);
        } catch (error) {
            return [];
        }
    },
    /**
     * 获取画板平台 375 750 M端 其他尺寸 PC端
     * @param {Number} width 画板宽度
     */
    getArtboardPlatform(width) {
        return (Math.round(width) == 375 || Math.round(width) == 750) ? PLATFORM.m : PLATFORM.pc;
    },
    /**
     * 获取meta信息
     * 
     * @param {*} sketchId
     * @param {*} artboardIndex
     * @returns
     */
    handleMeta(sketchId, artboardIndex) {
        // eg:
        // {
        //     "commit" : "b8111e3393c4ca1f2399ecfdfc1e9488029ebe7b",
        //     "pagesAndArtboards" : {
        //         "E6890372-BE93-4E4C-ACD1-8F8B10862938" : {
        //             "name" : "Page 1",
        //             "artboards" : {
        //             "214B376A-C4A3-47A9-9B87-DFBC49A6EFE0" : {
        //                  "name" : "Artboard 2"
        //              },
        //              "F8FE177A-5D6D-4A37-8BD1-B246A83A9C21" : {
        //                  "name" : "Artboard 1"
        //               }
        //             }
        //         }
        //     },
        //     "version" : 97,
        //     "fonts" : [],
        //     "compatibilityVersion" : 93,
        //     "app" : "com.bohemiancoding.sketch3",
        //     "autosaved" : 0,
        //     "variant" : "NONAPPSTORE",
        //     "created" : {
        //         "commit" : "b8111e3393c4ca1f2399ecfdfc1e9488029ebe7b",
        //         "appVersion" : "48.2",
        //         "build" : 47327,
        //         "app" : "com.bohemiancoding.sketch3",
        //         "compatibilityVersion" : 93,
        //         "version" : 97,
        //         "variant" : "NONAPPSTORE"
        //     },
        //     "saveHistory" : [
        //         "NONAPPSTORE.47327"
        //     ],
        //     "appVersion" : "48.2",
        //     "build" : 47327
        // }
        const cliSketchParseResultPath = global.globalPath.cliSketchParseResultPath;
        let sketchMeta = fs.readFileSync(`${cliSketchParseResultPath}/${sketchId}_${artboardIndex}/meta.json`);
        sketchMeta = eval(`(${sketchMeta})`);
        return sketchMeta;
    }
}
