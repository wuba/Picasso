/**
 * 判断图层是否有半透明背景
 *
 * @param {Object} layer 图层
 * @returns
 */
const isOpacityBackground = (layer) => {
    let isHasBackground = false;
    if (layer.style && Array.isArray(layer.style.fills) && layer.style.fills.length) {
        layer.style.fills = layer.style.fills.filter(fillItem => {
            return fillItem.isEnabled
        })
    }
    if (layer.backgroundColor && layer.hasBackgroundColor) {
        const {
            alpha,
        } = layer.backgroundColor;
        if (0 < alpha && alpha < 1) {
            isHasBackground = true;
        }
    } else if (layer.style && Array.isArray(layer.style.fills) && layer.style.fills.length && layer.style.fills[layer.style.fills.length - 1].isEnabled) { // 处理填充 fills,fills是数组，只支持单个情况,处理成背景色
        const fillStyle = layer.style.fills[layer.style.fills.length - 1];
        let {
            alpha,
        } = fillStyle.color;
        // 如果设置了 Opacity 属性，则 fills border 需要乘于这个数值
        if (layer.style.contextSettings) {
            alpha = layer.style.contextSettings.opacity * alpha;
        }
        if (0 < alpha && alpha < 1) {
            isHasBackground = true;
        }
    }
    return isHasBackground;
}
const isNotOpacityBackground = (layer) => {
    let isHasBackground = false;
    if (layer.style && Array.isArray(layer.style.fills) && layer.style.fills.length) {
        layer.style.fills = layer.style.fills.filter(fillItem => {
            return fillItem.isEnabled
        })
    }
    if (layer.backgroundColor && layer.hasBackgroundColor) {
        const {
            alpha,
        } = layer.backgroundColor;
        if (alpha == 1) {
            isHasBackground = true;
        }
    } else if (layer.style && Array.isArray(layer.style.fills) && layer.style.fills.length && layer.style.fills[layer.style.fills.length - 1].isEnabled) { // 处理填充 fills,fills是数组，只支持单个情况,处理成背景色
        const fillStyle = layer.style.fills[layer.style.fills.length - 1];
        let {
            alpha,
        } = fillStyle.color;
        // 如果设置了 Opacity 属性，则 fills border 需要乘于这个数值
        if (layer.style.contextSettings) {
            alpha = layer.style.contextSettings.opacity * alpha;
        }
        if (alpha == 1) {
            isHasBackground = true;
        }
    }
    return isHasBackground;
}

// 判断是否为底栏
/* eslint-disable */
const isBottomBar = (layer, artLayer) => {
    if (layer.frame &&
        artLayer.frame &&
        isNotOpacityBackground(layer) &&
        layer.isVisible &&
        layer.frame.x == artLayer.frame.x &&
        layer.frame.width == artLayer.frame.width &&
        layer.frame.y + layer.frame.height == artLayer.frame.y + artLayer.frame.height &&
        layer.frame.height > 40 && layer.frame.height < 140
    ) {
        return true;
    }
    return false;
}
/* eslint-disable */

/**
 * 层叠处理重构
 * 画版中蒙层下面的元素进行隐藏处理
 * 0.全屏蒙层(有透明度的)上面的图层 进行划分
 * 1.半弹层
 *   在半弹层上面，且和半弹层重叠,作为弹层
 *   不和半弹层重叠的部分放在base
 */

const handleCascading = (data) => {
    let cascadingJson = {};
    //基础层JSON
    let baseJson = JSON.parse(JSON.stringify(data));
    if (data.layers.length == 1 && data.layers[0]._class == 'artboard') {
        let artLayer = data.layers[0];
        let vFlag = true;
        let flag = true;
        
        //依据全屏弹层对json进行分割
        /* eslint-disable */
        function findFullLayer(data) {
            if (!data.layers) return data;
            for (let i = 0; i < data.layers.length; i++) {
                const layer = data.layers[i];
                if (layer._class != 'artboard' && layer._class != 'group' && layer.isVisible) {
                    if (layer._class == 'rectangle' &&
                        layer.frame &&
                        layer.isVisible &&
                        layer.frame.x <= artLayer.frame.x + 1 &&
                        layer.frame.y <= artLayer.frame.y + 1 &&
                        layer.frame.x + layer.frame.width >= artLayer.frame.width + artLayer.frame.x - 1 &&
                        layer.frame.y + layer.frame.height >= artLayer.frame.height + artLayer.frame.y - 1
                    ) {
                        if (isOpacityBackground(layer) && flag) {
                            flag = false;
                            vFlag = !vFlag;
                        }
                        layer.frame.x = artLayer.frame.x;
                        layer.frame.y = artLayer.frame.y;
                        layer.frame.width = artLayer.frame.width;
                        layer.frame.height = artLayer.frame.height;
                    }
                    if (vFlag == true) {
                        layer.isVisible = false;
                    }
                }
                if (Array.isArray(layer.layers) && layer.layers.length) {
                    findFullLayer(layer);
                }
            }

            return data;
        }
        /* eslint-disable */
        //属于弹层的JSON
        cascadingJson = findFullLayer(JSON.parse(JSON.stringify(data)));
        vFlag = false;
        flag = true;
        //弹层下面的JSON
        baseJson = findFullLayer(JSON.parse(JSON.stringify(data)))
    }
    return {
        baseJson,
        cascadingJson
    };
}

module.exports = handleCascading;
