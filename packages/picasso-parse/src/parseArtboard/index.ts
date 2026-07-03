

import { SKLayer } from '../types';
import filterHideLayer from './filterHideLayer';
import handleBorderCoordinate from './handleBorderCoordinate';
import handleOpacity from './handleOpacity';
import fixPosition from './fixPosition';
import handleSlice from './handleSlice';
import formatCoordinate from './formatCoordinate';
import trimByMask from './trimByMask';
import handleNotFillLayerOrder from './handleNotFillLayerOrder';
import { handlePanel } from './handlePanel';
/**
 * 分别对每个画板进行处理
 */
export default (layer:SKLayer, type: string): SKLayer => {
    let layers = [layer];
    // 代码模式，border坐标处理
    if (type === 'code' || type === 'lowcode') {
        layers = handleBorderCoordinate(layers);
    }
    // 透明度透传
    layers = handleOpacity(layers);
    // 相对坐标系 => 绝对坐标系
    layers = formatCoordinate(layers);
    // 修正坐标值 基础坐标系调整为：0,0;
    layers = fixPosition(layers);
    // Mask剪切处理
    layers = trimByMask(layers);
    // 代码模式，处理切片
    if (type === 'code' || type === 'lowcode') {
        layers = handleSlice(layers);
    }
    // 过滤隐藏图层
    layers = filterHideLayer(layers);
    // 处理透明图层顺序
    layers = handleNotFillLayerOrder(layers);
    // 属性面板解析
    layers = handlePanel(layers);

    return layers[0];
}
