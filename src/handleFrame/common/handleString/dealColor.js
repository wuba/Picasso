let { calculateRGB } = require('../../../common/utils')

module.exports = (colorStyleObj, layerStyle) => {
    try {
        if (!colorStyleObj) return {};
        let colorStyle = { ...colorStyleObj };
        let retObj = {};
        if (layerStyle.contextSettings) { // colorStyle 里的 alpha 的值都是 1
            colorStyle.alpha = layerStyle.contextSettings.opacity * colorStyle.alpha; // 设置透明度
        }
        retObj['color'] = 'rgba(' + calculateRGB(colorStyle.red) + ',' + calculateRGB(colorStyle.green) + ',' + calculateRGB(colorStyle.blue) + ',' + colorStyle.alpha + ')';
        return retObj;
    } catch (error) {
        console.log(error);
        return {};
    }
}
