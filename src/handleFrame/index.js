
const { PAGE_TYPE } = require("../common/global");
const handleOperation = require('./handleOperation');
const handleNormal = require('./handleNormal');

const handlePage = async (
    dataJson,
    sketchId,
    sketchName,
    artboardIndex,
    artboardName,
    errorObj,
    uuid,
    time,
    pageType,
    sendCDN,
    imgScale,
) => {
    // 运营页解析-高还原
    if (+pageType === PAGE_TYPE.ACTIVITY) {
        return await handleOperation(
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
        // 业务页解析-高可用
    } else {
        return await handleNormal(
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
    }
}
module.exports = handlePage;
