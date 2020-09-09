const handleClassName = require("../common/handleStructure/handleClassName");
const handleLayout = require("../common/handleLayout");
const handleCascading = require("../common/handleStructure/handleCascading");
const handleSingle = require('../common/handleStructure/handleSingle');
const preGenerateFrame = require('../common/handleStructure/preGenerateFrame');
const { simplifyText } = require("../common/handleStyle/handleText");

/**
 * 业务页面解析-高可用
 * 
 * @param {*} dataJson
 * @param {*} sketchId
 * @param {*} sketchName
 * @param {*} artboardIndex
 * @param {*} artboardName
 * @param {*} errorObj
 * @param {*} uuid
 * @param {*} time
 * @param {*} sendCDN
 * @param {*} imgScale
 */
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
        fonts
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
        imgScale,
    );
    /**
     * 分层处理
     */
    let currIndex = { num: 0 };
    let { baseJson, cascadingJson } = handleCascading(data);
    try {
        /**
        * 基础层处理
        */
        baseJson = handleSingle(
            baseJson,
            sketchId,
            sketchName,
            artboardIndex,
            artboardName,
            errorObj,
            uuid,
            time,
            currIndex,
            'base'
        );
        /**
         * 蒙层之上层结构处理
         */
        cascadingJson = handleSingle(
            cascadingJson,
            sketchId,
            sketchName,
            artboardIndex,
            artboardName,
            errorObj,
            uuid,
            time,
            currIndex,
            'cascading'
        );
    } catch (error) {
        console.log(error);
    }
    if (Array.isArray(cascadingJson[0].children)) {
        cascadingJson[0].children = cascadingJson[0].children.map(item => {
            item.isPosition = true;
            return item;
        })
        if (!baseJson[0].children) {
            baseJson[0].children = [];
        }
        baseJson[0].children = [...baseJson[0].children, ...cascadingJson[0].children];
    }
    data = baseJson;
    try {
        data = simplifyText(data);
        data = handleClassName(data);
        data = handleLayout(data);
    } catch (error) {
        console.log(error);
    }
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
