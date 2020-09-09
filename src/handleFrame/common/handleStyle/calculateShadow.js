/**
 *  处理阴影
 *  box-shadow 只解析一层的情况
 *  多个 shadow 的情况将导成图片, 每一层的 shadow 的模式都是 blendMode： 0 表示是正常的
 */

const {
    calculateRGB
} = require('../../../common/utils')

const getShadowStyle = (shadow, layer, type) => {
    let {
        alpha,
        red,
        green,
        blue
    } = shadow.color;

    alpha = shadow.contextSettings.opacity * alpha;

    let color = `rgba(${calculateRGB(red)},${calculateRGB(green)},${calculateRGB(blue)},${alpha})`;
    let offY = !layer.hasScale && layer.isFlippedVertical ? -shadow.offsetY : shadow.offsetY;
    let offX = !layer.hasScale && layer.isFlippedHorizontal ? -shadow.offsetX : shadow.offsetX;
    return type ? `${offX}px ${offY}px ${shadow.blurRadius}px ${shadow.spread}px ${color} ${type}` : `${offX}px ${offY}px ${shadow.blurRadius}px ${shadow.spread}px ${color}`
}

// 获取文本的 shadow 样式
const getTextShadowStyle = (shadow, layer) => {
    let {
        alpha,
        red,
        green,
        blue
    } = shadow.color;

    alpha = shadow.contextSettings.opacity * alpha;
    let offY = !layer.hasScale && layer.isFlippedVertical ? -shadow.offsetY : shadow.offsetY;
    let offX = !layer.hasScale && layer.isFlippedHorizontal ? -shadow.offsetX : shadow.offsetX;
    let color = `rgba(${calculateRGB(red)},${calculateRGB(green)},${calculateRGB(blue)},${alpha})`
    return `${offX}px ${offY}px ${shadow.blurRadius}px ${color}`
}

module.exports = (layer) => {
    if (layer._class == 'text') {
        let shadowStyleList = [];
        // 处理文本外阴影
        if (layer.style && layer.style.shadows) {
            // 查找所有可用的阴影
            let shadowList = [];
            layer.style.shadows.map(item => {
                if (item.isEnabled) {
                    shadowList.push(item)
                }
            })

            for (let item of shadowList) {
                let proStyle = getTextShadowStyle(item, layer)
                shadowStyleList.push(proStyle)
            }
            return shadowStyleList.join(', ')
        }
    } else { // 盒子阴影的设置
        let shadowStyleList = [], innerShadowStyleList = [];
        if (layer.style && layer.style.shadows) {
            // 查找所有可用的阴影
            let shadowList = [];
            layer.style.shadows.map(item => {
                if (item.isEnabled) {
                    shadowList.push(item)
                }
            })

            for (let item of shadowList) {
                let proStyle = getShadowStyle(item, layer)
                shadowStyleList.push(proStyle)
            }
        }

        if (layer.style && layer.style.innerShadows) {
            let innerShadowList = [];

            layer.style.innerShadows.map(item => {
                if (item.isEnabled) {
                    innerShadowList.push(item)
                }
            })

            for (let item of innerShadowList) {
                let proStyle = getShadowStyle(item, layer, 'inset')
                innerShadowStyleList.push(proStyle)
            }
        }
        let combineShadowStyle = [...shadowStyleList.reverse(), ...innerShadowStyleList.reverse()];
        return combineShadowStyle.join(', ')
    }

    return ''
}
