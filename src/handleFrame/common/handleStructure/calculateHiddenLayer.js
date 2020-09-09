/**
 * 计算隐藏图层， 判断图层是否在可视区范围内， 如果完全超出则标记删除该元素
 * 如果和 artboard 存在交叉的情况则通过 body overflow: hidden 进行处理
 */

let artboardLayer;
global.artboardLayerFrame = {};
const { isMixed } = require('../../../common/utils')

const caculateHiddenLayer = (data) => {
    for (let i = 0; i < data.layers.length; i++) {
        let layer = data.layers[i];
        if (layer._class == 'artboard') {
            artboardLayer = layer;
            global.artboardLayerFrame = artboardLayer.frame;
        }

        if (artboardLayer) {
            if (!isMixed(layer.frame, artboardLayer.frame)) { //如果完全没有交叉的情况则删除对应的层级
                layer.isDelete = true;
            }

            if (Array.isArray(layer.layers) && layer.layers.length && layer.isVisible) {
                caculateHiddenLayer(layer)
            }
        }
    }

    return data;
}

module.exports = caculateHiddenLayer;
