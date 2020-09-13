const fs = require('fs');
const path = require('path');
const process = require('child_process');
const fileSystem = require('file-system');
const handleSketchZip = require('./handleSketchZip');
const handlePageList = require('./handlePageList');
const handleFrame = require('./handleFrame');
const handleCode = require('./handleCode');
const handleJson = require('./handleJson');
const handleSketchFile = require('./handleSketchFile');
const saveVersion = require('./handleSketchFile/exportShape/saveVersion');
global.timer = null;
const {
    SKETCH_STATUS
} = require('./common/global');

const {
    rootPath,
    sketchtoolPath,
} = require('./common/path');

const {
    getArtboardPlatform
} = require('./common/sketchTools');

/**
 * 单个artboard解析
 */
const artboardParse = async (sketchId, sketchName, artboardIndex, artboardName, errorObj, uuid, {
    imgScale,
    pageType,
    classPrefix
}) => {
    global.imageCount = 0;
    global.imageMap = {};
    let currTime = new Date().getTime();
    let time = {
        preStart: currTime,
        preEnd: currTime,
        parseStart: currTime,
        parseEnd: currTime,
        postStart: currTime,
        postEnd: currTime
    };
    let dataJson;
    try {
        // 获取json数据
        dataJson = handlePageList(sketchId, sketchName, artboardIndex);

        let {
            data,
            platform,
            size,
            isMongolian,
            errorObj: errorObj2
        } = await handleFrame(dataJson, sketchId, sketchName, artboardIndex, artboardName, errorObj, uuid, time, pageType, 2, imgScale);

        let configJson = await handleJson(JSON.parse(JSON.stringify(data)), sketchId, sketchName, artboardIndex, artboardName);
        // 生成代码
        await handleCode(configJson, sketchId, sketchName, artboardIndex, artboardName, platform, size, pageType, classPrefix);
        time.parseEnd = new Date().getTime();
        return {
            sketchId,
            sketchName,
            artboardIndex,
            artboardName,
            sketchSimilarity: "",
            platform,
            size,
            isMongolian: isMongolian ? 1 : 2,
            status: SKETCH_STATUS.SUCCESS,
            errorObj: errorObj2,
            preTime: time.preEnd - time.preStart,
            parseTime: time.parseEnd - time.parseStart - (time.preEnd - time.preStart),
            postTime: time.postEnd - time.parseEnd
        }
    } catch (error) {
        console.log('画板解析报错，错误信息如下');
        console.log(error);

        return {
            sketchId,
            sketchName,
            artboardIndex,
            artboardName,
            sketchSimilarity: '',
            platform: '1',
            size: '',
            status: SKETCH_STATUS.FAIL,
            preTime: 0,
            parseTime: 0,
            postTime: 0
        }
    }
}

/**
 * 封装脚本异步执行方法
 * @param {string} sketchtoolString 命令行脚本string
 */
const processAsync = (sketchtoolString) => {
    return new Promise((resolve,reject) => {
        process.exec(sketchtoolString, { maxBuffer: 20000*1024 }, (error,stdout,stderr) => {
            if (stderr) {
                console.log(stderr);
            }
            if (error!==null) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    })
};

/**
 * 单个sketch解析
 * 
 */
module.exports = async ({
    src = '', // sketch源文件路径
    dest = '', // 生成代码存放路径
    imgScale = 1, // 导出图片尺寸(1 1.5 2 3) 默认 1
    pageType = 1, // 1 普通版 2 运营版 默认 1
    classPrefix = '', // 生成样式className前缀 默认 ''
}) => {
    // dest没传,设置默认值
    if (!dest) {
        const srcArr = src.split('/');
        const srcList = srcArr.slice(0, srcArr.length-1);
        dest = srcList.join('/');
    }
    global.flag = true;
    // 路径初始化
    const cliSketchResource = path.resolve(`${rootPath}`, src);
    console.log('sketch源文件路径', cliSketchResource);
    const cliSketchResourcePathArr = cliSketchResource.split('/');
    const cliSketchResourcePathList = cliSketchResourcePathArr.slice(0, cliSketchResourcePathArr.length-1);
    const cliSketchResourcePath = cliSketchResourcePathList.join('/');
    const cliSketchParseResultPath = path.resolve(`${rootPath}`, `${dest}`);
    console.log('解析生成代码存放目录', cliSketchParseResultPath);
    const cliShapePath = `${cliSketchParseResultPath}/shapeImage`;

    // 获取sketch名称
    const sketchName = cliSketchResourcePathArr[cliSketchResourcePathArr.length-1].split('.sketch')[0];

    if (fs.existsSync(`${cliSketchParseResultPath}/${sketchName}`)) {
        await processAsync(`rm -rf ${cliSketchParseResultPath}/${sketchName}`);
    }
    global.globalPath = {
        cliShapePath,
        cliSketchResourcePath,
        cliSketchParseResultPath,
        cliHandleImageDir: `${cliSketchParseResultPath}/picasso_handle_images/`
    }

    // 获取当前sketch软件版本信息
    const sketchVersionResult = process.execSync(`${sketchtoolPath} -v`);
    const sketchVersion = sketchVersionResult.toString().split('Version')[1].split('(')[0].trim();

    console.log('当前Sketch软件版本:', sketchVersion);

    const sketchId = 'artboard';

    // 解析结果存放文件夹不存在，则自动创建
    if (!fs.existsSync(cliSketchParseResultPath)) {
        fs.mkdirSync(cliSketchParseResultPath)
    }

    return new Promise((resolve, reject) => {
        let appVersion = '';
        try {
            console.log(`===${sketchName}.sketch解析-开始===`);
            const rst = process.execSync(`${sketchtoolPath} metadata ${cliSketchResourcePath}/${sketchName}.sketch`);
            appVersion = JSON.parse(rst.toString()).appVersion;
            console.log(`${sketchName}.sketch原生版本:${appVersion}`);

            console.log(`修改原来版本${appVersion} 到 ${sketchVersion},并且unlink外部库`);
            saveVersion(`${cliSketchResourcePath}/${sketchName}.sketch`);
            global.timer = setInterval(async () => {
                try {
                    const rst = await processAsync(`${sketchtoolPath} metadata ${cliSketchResourcePath}/${sketchName}.sketch`);
                    let doc = await processAsync(`${sketchtoolPath} dump ${cliSketchResourcePath}/${sketchName}.sketch`);
                    
                    let foreignSymbols = JSON.parse(doc.toString()).foreignSymbols;

                    appVersion = JSON.parse(rst.toString()).appVersion;
                    // skethc文件版本和当前sketch软件一致 且 外部库都已经转化为内部库
                    if (global.flag&&appVersion == sketchVersion && (!foreignSymbols || !Array.isArray(foreignSymbols) || (Array.isArray(foreignSymbols) && foreignSymbols.length == 0))) {
                        clearInterval(global.timer);
                        global.flag = false;
                        let artboardsList = await handleSketchFile(sketchId, sketchName);
                        if (artboardsList.length > 0) {
                            process.execSync(`cp ${cliSketchParseResultPath}/${sketchId}/${sketchName}.sketch ${cliSketchParseResultPath}/${sketchId}_info.sketch`);
                            //导出切片
                            process.execSync(`${sketchtoolPath} export slices ${cliSketchParseResultPath}/${sketchId}/${sketchName}.sketch --output=${cliSketchParseResultPath}/${sketchId}/slices --use-id-for-name=YES --group-contents-only=YES --scales=2`);
                            // sketch 解压
                            handleSketchZip(sketchId, sketchName, 'info');

                            const documentJson = handlePageList(sketchId, sketchName, 'info');
                            // 页面列表
                            let pageList = [];
                            // 排除symbolMaster页
                            documentJson.forEach(item => {
                                if (!(Array.isArray(item.layers) && item.layers.length > 0 && item.layers[0]._class == 'symbolMaster')) {
                                    pageList.push(item);
                                }
                            })
                            //页面默认json
                            let pageJson = pageList[0];
                            // 补充画板信息
                            for (let n = 0; n < artboardsList.length; n++) {
                                for (let j = 0; j < pageList.length; j++) {
                                    pageJson = pageList[j];
                                    for (let i = 0; i < pageJson.layers.length; i++) {
                                        const currItem = pageJson.layers[i];
                                        if (currItem._class == 'artboard' && currItem.do_objectID == artboardsList[n].uuid) {
                                            artboardsList[n].artboardName = currItem.name;
                                            currItem.frame.width = Math.round(currItem.frame.width);
                                            artboardsList[n].size = currItem.frame.width;
                                            artboardsList[n].platform = getArtboardPlatform(artboardsList[n].size);
                                        }
                                    }
                                }
                            }
                        }
                        let infoPath = `${cliSketchParseResultPath}/${sketchId}_info`;
                        let sketchPath = `${cliShapePath}/${sketchName}.sketch`;
                        // 删除中间产物文件
                        if (fs.existsSync(`${infoPath}.zip`)) {
                            fs.unlinkSync(`${infoPath}.zip`);
                        }
                        if (fs.existsSync(`${infoPath}.sketch`)) {
                            fs.unlinkSync(`${infoPath}.sketch`);
                        }
                        if (fs.existsSync(sketchPath)) {
                            fs.unlinkSync(sketchPath)
                        }
                        // 有画板名称的画板(有效画板)
                        artboardsList = artboardsList.filter(({
                            artboardName
                        }) => artboardName);
                        artboardsList = artboardsList.map((item,index)=> ({...item, artboardIndex: index+1}));
                        let resultList = [];

                        for (let i = 0; i < artboardsList.length; i++) {
                            let {
                                sketchId,
                                sketchName,
                                artboardIndex,
                                artboardName,
                                uuid
                            } = artboardsList[i];

                            console.log(`---第${artboardIndex}张画板解析-开始---`);
                            if (fs.existsSync(`${cliSketchParseResultPath}/${sketchId}_${artboardIndex}`)) {
                                await processAsync(`rm -rf ${cliSketchParseResultPath}/${sketchId}_${artboardIndex}`);
                            }
                            await processAsync(`cp -r ${cliSketchParseResultPath}/${sketchId}_info ${cliSketchParseResultPath}/${sketchId}_${artboardIndex}`);
                            let errorObj = {};
                            let item = await artboardParse(sketchId, sketchName, artboardIndex, artboardName, errorObj, uuid,{
                                classPrefix,
                                imgScale:+imgScale,
                                pageType:+pageType
                            });
                            let resultPath = `${cliSketchParseResultPath}/${sketchId}_${artboardIndex}`;
                            if (fs.existsSync(`${cliSketchParseResultPath}/${sketchName}/${artboardIndex}_page`)) {
                                await processAsync(`rm -rf ${cliSketchParseResultPath}/${sketchName}/${artboardIndex}_page`);
                            }
                            fileSystem.copySync(`${resultPath}_page`, `${cliSketchParseResultPath}/${sketchName}/${artboardIndex}_page`);
                            if (fs.existsSync(`${resultPath}.zip`)) {
                                fs.unlinkSync(`${resultPath}.zip`);
                            }
                            if (fs.existsSync(`${resultPath}.sketch`)) {
                                fs.unlinkSync(`${resultPath}.sketch`);
                            }
                            if (fs.existsSync(resultPath)) {
                                fileSystem.rmdirSync(resultPath);
                            }
                            if (fs.existsSync(`${resultPath}_page`)) {
                                fileSystem.rmdirSync(`${resultPath}_page`);
                            }

                            resultList.push(item);
                            console.log(`---第${artboardIndex}张画板解析-结束---`);
                        }
                        // 删除多余文件
                        fileSystem.rmdirSync(`${cliSketchParseResultPath}/${sketchId}_info`);
                        fileSystem.rmdirSync(`${cliSketchParseResultPath}/${sketchId}`);
                        fileSystem.rmdirSync(`${cliSketchParseResultPath}/picasso_handle_images`);
                        fileSystem.rmdirSync(`${cliSketchParseResultPath}/shapeImage`);
                        console.log(`===${sketchName}.sketch解析-结束===`);

                        resolve(resultList);
                    }

                } catch (error) {
                    console.log('error', error);
                    clearInterval(global.timer);
                }
            }, 500);
        } catch (error) {
            console.log(error);
            reject(error);
        }
    })
}
