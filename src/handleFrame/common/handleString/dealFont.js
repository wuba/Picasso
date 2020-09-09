/**
 * 获取字体大小，文字字体， 字体粗细
 */
const getFontWeight = require('./getFontWeight');
module.exports = (fontStyle, size = 1) => {
    try {
        let retObj = {};
        retObj["font-size"] = fontStyle.attributes.size * size;
        //获取字体形状（是否倾斜及是否加粗）
        let fontName = fontStyle.attributes.name;
        // weight解析
        retObj['font-weight'] = getFontWeight(fontName)
        return retObj;
    } catch (error) {
        console.log(error);
        return {};
    }
};
