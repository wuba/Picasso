/**
 * 判断是否有包含或者重叠
 *
 * @param {*} target
 * @param {*} container
 * @returns
 */
const isContain = (target, container) => {
    if (!target.structure || !container.structure) {
        return false
    }
    target = target.structure
    container = container.structure
    var targetWidth = target.width,
        targetHeight = target.height,
        targetLeft = target.x,
        targetRight = target.x + target.width,
        targetTop = target.y,
        targetBottom = target.y + target.height,
        containerWidth = container.width,
        containerHeight = container.height,
        containerLeft = container.x,
        containerRight = container.x + container.width,
        containerTop = container.y,
        containerBottom = container.y + container.height
    if (
        targetLeft >= containerLeft &&
        targetTop >= containerTop &&
        targetRight <= containerRight &&
        targetBottom <= containerBottom
    ) {
        return true
    }
    return false
}
/**
 * 判断图层是否有半透明背景
 *
 * @param {Object} layer 图层
 * @returns
 */
const isOpacityBackground = (layer) => {
    let isHasBackground = false
    if (
        layer.style &&
        Array.isArray(layer.style.fills) &&
        layer.style.fills.length
    ) {
        layer.style.fills = layer.style.fills.filter((fillItem) => {
            return fillItem.isEnabled
        })
    }
    if (layer.backgroundColor && layer.hasBackgroundColor) {
        const { alpha } = layer.backgroundColor
        if (0 < alpha && alpha < 1) {
            isHasBackground = true
        }
    } else if (
        layer.style &&
        Array.isArray(layer.style.fills) &&
        layer.style.fills.length &&
        layer.style.fills[layer.style.fills.length - 1].isEnabled
    ) {
        // 处理填充 fills,fills是数组，只支持单个情况,处理成背景色
        const fillStyle = layer.style.fills[layer.style.fills.length - 1]
        let { alpha, red, green, blue } = fillStyle.color
        // 如果设置了 Opacity 属性，则 fills border 需要乘于这个数值
        if (layer.style.contextSettings) {
            alpha = layer.style.contextSettings.opacity * alpha
        }
        if (0 < alpha && alpha < 1) {
            isHasBackground = true
        }
    }
    return isHasBackground
}
const isNotOpacityBackground = (layer) => {
    let isHasBackground = false
    if (
        layer.style &&
        Array.isArray(layer.style.fills) &&
        layer.style.fills.length
    ) {
        layer.style.fills = layer.style.fills.filter((fillItem) => {
            return fillItem.isEnabled
        })
    }
    if (layer.backgroundColor && layer.hasBackgroundColor) {
        const { alpha, red, green, blue } = layer.backgroundColor
        if (alpha == 1) {
            isHasBackground = true
        }
    } else if (
        layer.style &&
        Array.isArray(layer.style.fills) &&
        layer.style.fills.length &&
        layer.style.fills[layer.style.fills.length - 1].isEnabled
    ) {
        // 处理填充 fills,fills是数组，只支持单个情况,处理成背景色
        const fillStyle = layer.style.fills[layer.style.fills.length - 1]
        let { alpha, red, green, blue } = fillStyle.color
        // 如果设置了 Opacity 属性，则 fills border 需要乘于这个数值
        if (layer.style.contextSettings) {
            alpha = layer.style.contextSettings.opacity * alpha
        }
        if (alpha == 1) {
            isHasBackground = true
        }
    }
    return isHasBackground
}
// 判断是否为底栏
const isBottomBar = (layer, artLayer) => {
    if (
        layer.structure &&
        artLayer.structure &&
        isNotOpacityBackground(layer) &&
        layer.isVisible &&
        layer.structure.x == artLayer.structure.x &&
        layer.structure.width == artLayer.structure.width &&
        layer.structure.y + layer.structure.height ==
            artLayer.structure.y + artLayer.structure.height &&
        layer.structure.height > 40 &&
        layer.structure.height < 140
    ) {
        return true
    }
    return false
}
/**
 * 层叠处理重构
 * 画版中蒙层下面的元素进行隐藏处理
 * 0.全屏蒙层(有透明度的)上面的图层 进行划分
 * 1.半弹层
 *    在半弹层上面，且和半弹层重叠,作为弹层
 *    不和半弹层重叠的部分放在base
 *
 */
import { Layer } from './types'

const handleCascading = (data: Layer) => {
    if (data.children.length < 2) {
        return {
            baseJson: [{...data,children:[]}, ...data.children],
            cascadingJson: [],
        }
    }
    
    let cascadingIndex = -1;
    for (let i = 0; i < data.children.length; i++) {
        const layer = data.children[i];
        if (
            layer.type !== 'Text' &&
            layer.structure?.x <= data.structure?.x + 1 &&
            layer.structure?.y <= data.structure?.y + 1 &&
            layer.structure?.x + layer.structure?.width >=
                data.structure?.width + data.structure?.x - 1 &&
            layer.structure?.y + layer.structure?.height >=
                data.structure?.height + data.structure?.y - 1
        ) {
            cascadingIndex = i;
            break;
        }
    }

    if (cascadingIndex > 0) {
        return {
            baseJson: [{...data,children:[]}, ...data.children.slice(0,cascadingIndex)],
            cascadingJson: data.children.slice(cascadingIndex),
        }
    }

    return {
        baseJson: [{...data,children:[]}, ...data.children],
        cascadingJson: [],
    }
}

export default handleCascading
