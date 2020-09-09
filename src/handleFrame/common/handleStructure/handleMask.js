/**
 *处理 mask 的情况,
 * @param {*} layer
 * 当 mask 图层含有 fills 且存在图片填充的时候， 优先级高于图片
 * mask 用于遮挡内容
 * 处理一层的情况下：
 *
 * mask 是一个分隔线， 一个组存在多个 mask 的情况,
 * 在上面的会在图层的上面
 * 文字超出暂时还不能截取
 * 当 mask 和 其他成员组不在同一个层级的时候， 需要特殊处理
 * mask 都会被处理为矩形
 * mask 只会影响同层以及他的子元素
 * mask 只会作用在组上
 */

const {
    getEnabledFill
} = require('../../../common/utils');


const handleOverMask = require('./handleOverMask');

// 递归的截取 mask 的内容

const interceptLayer = (maskLayer, list = []) => {
    for (let item of list) {
        if (!item.realFrame) {
            item.realFrame = JSON.parse(JSON.stringify(item.frame));
        }
        handleOverMask(item, maskLayer);
        if (item.exportOptions && item.exportOptions.exportFormats && item.exportOptions.exportFormats.length) { // 是切片的情况
            item.realFrame = JSON.parse(JSON.stringify(item.frame));
        }
        if (item.frame.width == 0 || item.frame.height == 0) {
            item.isDelete = true;
        }
        // 递归截取子元素
        if (item._class == 'group' && !item.isDelete) {
            interceptLayer(maskLayer, item.layers)
        }
    }
}

// 处理 mask 有背景图的情况, 判断是否存在和 mask 一样大的且有背景或者背景色的图层， 则删除 mask 的背景色
const handleMaskBg = (maskLayer) => {
    let fillObj = getEnabledFill(maskLayer);
    if (fillObj) {
        if (fillObj.image && fillObj.image._ref) {
            maskLayer.image = fillObj.image;
            maskLayer.type = 'maskBg';
        }
    }
}

const handleMask = (data) => {
    let isExist = data.layers.some(item => item.hasClippingMask);
    if (isExist) { // 如果存在则递归处理
        let maskLayer, list = [];
        let indexList = []; // 记录 mask 的位置

        for (let i = 0; i < data.layers.length; i++) {
            let item = data.layers[i];
            let next = i < data.layers.length - 1 ? data.layers[i + 1] : null;
            if (item.hasClippingMask) {
                // 判断mask 是否存在 背景图
                handleMaskBg(item);
            }
            if (item.hasClippingMask && next && !next.hasClippingMask) {
                indexList.push(i);
            }

            if (data.layers.length == 1 && data.layers[0].hasClippingMask && !getEnabledFill(data.layers[0])) {
                data.layers[0].isDelete = true; //删除一个组中只有一个 mask 的情况
            }
        }


        indexList.push(data.layers.length);
        for (let k = 0; k < indexList.length - 1; k++) {
            let prev = indexList[k];
            let next = indexList[k + 1];

            maskLayer = data.layers[prev];

            // 如果 prev 和 next 之间存在 group， 则 作用范围知道组即结束了
            for (let i = prev + 1; i < next; i++) {
                if (data.layers[i].shouldBreakMaskChain) {
                    next = i;
                    break;
                }
            }

            list = data.layers.slice(prev + 1, next);
            if (list.length) {
                interceptLayer(maskLayer, list)
            }
            data.layers.splice(prev + 1, list.length, ...(JSON.parse(JSON.stringify(list))));
        }
    }

    for (let i = 0; i < data.layers.length; i++) {
        let layer = data.layers[i]
        if (layer.layers && layer.layers.length && !layer.isDelete) {
            handleMask(layer);
        }
    }
    return data;

}
module.exports = handleMask;
