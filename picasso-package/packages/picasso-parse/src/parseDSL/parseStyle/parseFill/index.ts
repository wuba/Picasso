import handleSolidColorFill from './handleSolidColorFill';
import handleGradientColorFill from './handleGradientColorFill';
import handleImgFill from './handleImgFill';
import { SKLayer,SKFillItem,Background } from '../../../types';
/**
  * 处理填充
  * 填充类型
  * fillStyle.fillType
  *           0  纯色
  *           1  渐变色
  *           2
  *           3
  *           4  填充图
  *           5  纹理效果
  * fillStyle.fillType fillStyle.gradient.gradientType
  *        1                    0   线性渐变色 完全css解析
  *        1                    1   径向渐变色
  *                                 - 圆形或者椭圆但是没有斜角度的CSS解析
  *                                 - 导出为图片
  *        1                    2   环形渐变色  css实验属性暂时不支持 ，导出为图片处理
  *
  * @param {Object} layer 图层
  */
export default (layer: SKLayer):Background => {
    let fillList = [];
    // 过滤无效填充
    if (layer.style && Array.isArray(layer.style.fills)) {
        fillList = layer.style.fills.filter(fillItem => {
            return fillItem.isEnabled;
        });
    }
    if (fillList.length === 0 || layer._class === 'text') {
        return {};
    }
    // 只解析单层渐变
    const fillStyle: SKFillItem = fillList[fillList.length - 1];
    const fillType = fillStyle.fillType;

    //填充为纯色的情况
    if (fillType == 0) {
        return handleSolidColorFill(fillStyle, layer);
    }

    //填充为渐变色的情况
    if (fillType == 1) {
        return handleGradientColorFill(fillStyle, layer);
    }

    //填充图片
    if (fillType == 4) {
        return handleImgFill(fillStyle,layer);
    }
    return {};
}
