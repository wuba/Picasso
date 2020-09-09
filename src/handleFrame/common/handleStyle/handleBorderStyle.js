const {
    calculateRGB
} = require('../../../common/utils');
/**
 * "position": 属性表示 border 设置的位置
 * 1 => Inside border 位于盒子的内部
 * 0 => Center border 盒子便于位于 boder 之间
 * 2 =>  Outside 外边框
 */

module.exports = (record, layer) => {
    //没有处理多边框的情况，现在只支持单边框，其实borders是一个数组
    if (layer.style && layer.style.borders && layer.style.borders.length && layer._class != 'artboard') {
        let borderList = layer.style.borders.filter(item => item.isEnabled)
        if (borderList.length) {
            let borderStyle = borderList[0]; // 不规则 border 已经导出为图片
            let borderAlpha = borderStyle.color.alpha;
            // 只要判断是否存在即可， 因为可能 Opacity 的值为 0 的情况
            if (layer.style.contextSettings) {
                borderAlpha = layer.style.contextSettings.opacity * borderAlpha;
            }
            // 设置边框
            record.border = {
                width: borderStyle.thickness,
                alpha: borderAlpha,
                red: borderStyle.color.red,
                green: borderStyle.color.green,
                blue: borderStyle.color.blue
            };

            let border = record.border;
            record.style['border'] = `${border.width}px solid rgba(${calculateRGB(border.red)},${calculateRGB(border.green)},${calculateRGB(border.blue)},${border.alpha})`;
        }
    }
}
