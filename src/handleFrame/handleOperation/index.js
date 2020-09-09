/**
 * 运营活动专用
 */
const formatData = require("../common/handleStructure/formatData");
const formatTreeData = require("../common/handleStructure/formatTreeData");
const preGenerateFrame = require('../common/handleStructure/preGenerateFrame');

const layout = require("./layout");

const generateFrame = async (
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
    let {
        data,
        platform,
        size,
        appVersion,
        fonts,
    } = await preGenerateFrame(
        dataJson,
        sketchId,
        sketchName,
        artboardIndex,
        artboardName,
        errorObj,
        uuid,
        time,
        sendCDN,
        imgScale
    );
    /**
     * 坐标缩放处理
     */
    data = formatTreeData(
        data,
        sketchId,
        sketchName,
        artboardIndex,
        artboardName
    );
    // 格式化
    data = formatData(data);
    // 布局
    data = layout(data, platform);
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

module.exports = generateFrame;
