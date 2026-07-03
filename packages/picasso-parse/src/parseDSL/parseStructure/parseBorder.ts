import { precisionControl,transSketchColor } from '../../common/utils'
import { SKLayer, Border, BorderItem } from '../../types'
/**
 * 'position': 属性表示 border 设置的位置
 * 1 => Inside border 位于盒子的内部
 * 0 => Center border 盒子便于位于 boder 之间
 * 2 =>  Outside 外边框
 */

export default (layer:SKLayer): Border => {
    //没有处理多边框的情况，现在只支持单边框，其实borders是一个数组
    if (layer.style && layer.style.borders && layer.style.borders.length && layer._class != 'artboard') {
        let borderList = layer.style.borders.filter(item => item.isEnabled)
        if (borderList.length) {
            let borderStyle = borderList[0]; // 不规则 border 已经导出为图片
            let borderAlpha = borderStyle.color.alpha;
            // 只要判断是否存在即可， 因为可能 Opacity 的值为 0 的情况
            if (layer.style&&layer.style.contextSettings) {
                borderAlpha = layer.style.contextSettings.opacity * borderAlpha;
            }
            // 设置边框
            const border: BorderItem = {
                width: precisionControl(borderStyle.thickness),
                style: 'solid',
                color: transSketchColor({
                    red: borderStyle.color.red,
                    green: borderStyle.color.green,
                    blue: borderStyle.color.blue,
                    alpha: borderAlpha,
                }),
            }

            return {
                left: border,
                top: border,
                right: border,
                bottom: border
            }
        }
    }
}
