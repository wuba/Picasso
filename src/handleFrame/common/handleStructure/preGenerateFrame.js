
const fs = require("fs");
const child_process = require("child_process");

const { sketchtoolPath } = require("../../../common/path");

const parseSymbol = require("./parseSymbol");
const { handleMeta } = require("../../../common/sketchTools");
const calculateCoordinate = require("./calculateCoordinate");
const calculateHiddenLayer = require("./calculateHiddenLayer");
const handleMask = require("./handleMask");

const handleSlice = require("../handleImg/handleSlice");
const handleImgName = require("../handleImg/handleImgName");
const calculateExportLayer = require("../handleImg/calculateExportLayer");
const handleShapePath = require("../handleImg/handleShapePath");

/**
 * 运营版 和 普通版 公共的处理部分
 * 
 */
module.exports = async (
    dataJson,
    sketchId,
    sketchName,
    artboardIndex,
    artboardName,
    errorObj,
    uuid,
    time,
    sendCDN,
    imgScale,
) => {
    const cliSketchParseResultPath = global.globalPath.cliSketchParseResultPath;
    /**
     * 模块处理
     */
    let { data, platform, size } = parseSymbol(
        dataJson,
        sketchId,
        sketchName,
        artboardIndex,
        artboardName,
        errorObj,
        uuid
    );
    /**
     * 坐标处理
     */
    data = calculateCoordinate(data);
    /**
     * 隐藏无用图层
     */
    data = calculateHiddenLayer(data);
    /**
     * 切片-处理
     */
    data = await handleSlice(
        data,
        sketchId,
        sketchName,
        artboardIndex,
        artboardName,
        imgScale,
    );
    /**
     * 判断是否需要导图-处理
     */
    let exportLayerList = calculateExportLayer(data);
    if (!fs.existsSync(`${cliSketchParseResultPath}/${sketchId}/shape`)) {
        child_process.execSync(`mkdir ${cliSketchParseResultPath}/${sketchId}/shape`);
    }
    time.preStart = new Date().getTime();
    /**
     * 导出切片
     */
    child_process.execSync(
        `${sketchtoolPath} export layers ${cliSketchParseResultPath}/${sketchId}/${sketchName}.sketch --items=${exportLayerList.join(
            ","
        )} --output=${cliSketchParseResultPath}/${sketchId}/shape --use-id-for-name=YES --group-contents-only=YES --save-for-web=YES --scales=${imgScale}`
    );
    time.preEnd = new Date().getTime();
    /**
     * 处理不规则图形尺寸问题
     */
    try {
        let time = new Date().valueOf();
        console.log('处理不规则图形尺寸问题-开始');
        await handleShapePath(
            data,
            sketchId,
            sketchName,
            artboardIndex,
            imgScale,
        );
        console.log('处理不规则图形尺寸问题-结束，耗时：', (new Date().valueOf() - time) / 1000 + 's');
    } catch (error) {
        console.log(error);
    }
    //图片提取完毕后杀掉sketch;
    try {
        child_process.execSync(`killall Sketch`);
    } catch (error) {
        // console.log(error);
    }
    //处理Mask
    data = handleMask(data);
    //图片重命名
    try {
        data = await handleImgName(data, sketchId, artboardIndex, sendCDN);
    } catch (error) {
        console.log(error);
    }
    //获取版本信息
    let { appVersion, fonts } = handleMeta(sketchId, artboardIndex);
    return {
        data,
        platform,
        size,
        appVersion,
        fonts,
        isMongolian: false,
        errorObj
    };
};
