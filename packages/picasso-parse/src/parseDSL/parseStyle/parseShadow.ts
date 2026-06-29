import { SKLayer, SKShadowItem, BoxShadowItem, TextShadowItem,Style } from '../../types';
import { precisionControl,transSketchColor } from '../../common/utils';

/**
 *  处理阴影
 *  box-shadow 只解析一层的情况
 *  多个 shadow 的情况将导成图片, 每一层的 shadow 的模式都是 blendMode： 0 表示是正常的
 */
const getShadowStyle = (shadow: SKShadowItem , layer:SKLayer, type: string = ''): BoxShadowItem => {
    let {
        alpha,
        red,
        green,
        blue
    } = shadow.color;

    alpha = shadow.contextSettings.opacity * alpha;
    const offY = !layer.hasScale && layer.isFlippedVertical ? -shadow.offsetY : shadow.offsetY;
    const offX = !layer.hasScale && layer.isFlippedHorizontal ? -shadow.offsetX : shadow.offsetX;

    return {
        type,
        blurRadius: precisionControl(shadow.blurRadius),
        spread: precisionControl(shadow.spread),
        offsetX: precisionControl(offX),
        offsetY: precisionControl(offY),
        color: transSketchColor({red, green, blue, alpha}),
    }
}

// 获取文本的 shadow 样式
const getTextShadowStyle = (shadow: SKShadowItem, layer:SKLayer):TextShadowItem => {
    let {
        alpha,
        red,
        green,
        blue
    } = shadow.color;

    alpha = shadow.contextSettings.opacity * alpha;
    let offY = !layer.hasScale && layer.isFlippedVertical ? -shadow.offsetY : shadow.offsetY;
    let offX = !layer.hasScale && layer.isFlippedHorizontal ? -shadow.offsetX : shadow.offsetX;

    return {
        blurRadius: precisionControl(shadow.blurRadius),
        spread: precisionControl(shadow.spread),
        offsetX: precisionControl(offX),
        offsetY: precisionControl(offY),
        color: transSketchColor({red, green, blue, alpha}),
    }
}

export default (layer:SKLayer):Style => {
    if (layer._class === 'text') {
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

            return {
                textShadow: shadowStyleList
            };
        }
    } else {
        // 盒子阴影的设置
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

        return {
            boxShadow: [...shadowStyleList.reverse(), ...innerShadowStyleList.reverse()]
        };
    }
}
