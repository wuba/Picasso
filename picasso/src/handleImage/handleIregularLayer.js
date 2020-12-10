import isOval from './handleJudge/isOval';
import isRectangle from './handleJudge/isRectangle';
import isRegularShadow from './handleJudge/isRegularShadow';
import isRegularBorder from './handleJudge/isRegularBorder';

/**
 * 计算不规则图形
 *
 * 如果一个组中存在不规则的 mask则 这个组将会做成一张切片
 *
 */
export default (layer) => {
    // 如果组上有阴影， 则标记为导出的图形
    if (
        layer.type == 'group'
        && layer.style.shadows
        && layer.style.shadows.find(item => item.isEnabled)
    ) {
        layer.layers = [];

        return (layer.isRegular = false);
    }

    // 如果图层是图片且有 Color Adjust 属性， 则导出为图片
    if (
        layer._class == 'bitmap'
        && layer.style
        && layer.style.colorControls
        && layer.style.colorControls.isEnabled
    ) {
        return (layer.isRegular = false);
    }

    // 处理边框导出情况
    if (!isRegularBorder(layer)) {
        return (layer.isRegular = false);
    }

    // 判断组内是否存在 mask 且是不规则图形则将整个组导出为图片
    if (layer._class == 'star' || layer._class == 'triangle') {
        return (layer.isRegular = false);
    }

    // 判断 parent 内是否存在组
    let groupObj = parent.layers.find(item => item._class == 'group') // 存在不被作用的组

    if (!groupObj) {
        let maskIsRegular = parent.layers.find((item) => {
            if (item._class == 'oval') {
                return item.hasClippingMask && !isOval(item)
            }

            if (item._class == 'rectangle') {
                return item.hasClippingMask && !isRectangle(item)
            }

            return (
                item.hasClippingMask &&
                (item._class == 'shapePath' ||
                    item._class == 'shapeGroup' ||
                    item._class == 'star')
            )
        })

        if (maskIsRegular) {
            parent.layers = []
            exportLayerList.push(parent.do_objectID)
            return (parent.isRegular = false)
        }
    }
    layer.isRegular = true // 先假设所有的图层都是规则的
    if (layer._class == 'shapeGroup') {
        layer.layers = []
        return (layer.isRegular = false)
    }

    if (layer._class == 'shapePath') {
        // shape 标记为不规则
        if (
            !(
                layer.style &&
                layer.style.startMarkerType == 0 &&
                layer.style.endMarkerType == 0 &&
                Array.isArray(layer.points) &&
                layer.points.length == 2
            )
        ) {
            return (layer.isRegular = false)
        }
    }

    if (layer.style && layer.points) {
        // 排除 Mask 的情况
        if (layer._class == 'oval') {
            let isRegularOval = isOval(layer) // 不规则的圆
            layer.isRegular = isRegularOval
        }

        if (layer._class == 'rectangle') {
            let isRegularRect = isRectangle(layer) // 不规则的矩形
            layer.isRegular = isRegularRect
        }
    }
    if (layer._class == 'text' && layer.style && layer.style.borders) {
        // 如果文本有可用的 border 也导出图片
        let rst = layer.style.borders.find((border) => {
            return border.isEnabled
        })
        if (rst) {
            layer.isRegular = false
        }
    }

    if (layer.isRegular) {
        layer.isRegular = isRegularShadow(layer)
    }

    if (
        layer.isRegular &&
        layer.style &&
        layer.style.blur &&
        layer.style.blur.isEnabled
    ) {
        layer.isRegular = false // 带滤镜效果标记导出为图层
    }
}
