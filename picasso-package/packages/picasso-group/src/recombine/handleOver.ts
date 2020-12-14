import { Layer } from '../types'
/**
 * 处理超出
 * @param {*} targetLayer 被比较的图层
 * @param {*} currLayer 比较的图层
 */
export default (targetLayer: Layer, currLayer: Layer) => {
    if (!targetLayer || !currLayer) {
        return -1
    }
    let targetLayerLeft = targetLayer.structure.x,
        targetLayerRight = targetLayer.structure.x + targetLayer.structure.width,
        targetLayerTop = targetLayer.structure.y,
        targetLayerBottom = targetLayer.structure.y + targetLayer.structure.height,
        currLayerLeft = currLayer.structure.x,
        currLayerRight = currLayer.structure.x + currLayer.structure.width,
        currLayerTop = currLayer.structure.y,
        currLayerBottom = currLayer.structure.y + currLayer.structure.height

    if (currLayerLeft > targetLayerLeft) {
        targetLayer.structure.x = currLayer.structure.x
        targetLayer.structure.width =
            targetLayer.structure.width - (currLayerLeft - targetLayerLeft) > 0
                ? targetLayer.structure.width - (currLayerLeft - targetLayerLeft)
                : 0
    }

    if (currLayerTop > targetLayerTop) {
        targetLayer.structure.y = currLayer.structure.y
        targetLayer.structure.height =
            targetLayer.structure.height - (currLayerTop - targetLayerTop) > 0
                ? targetLayer.structure.height - (currLayerTop - targetLayerTop)
                : 0
    }

    if (currLayerBottom < targetLayerBottom) {
        targetLayer.structure.height =
            targetLayer.structure.height - (targetLayerBottom - currLayerBottom) > 0
                ? targetLayer.structure.height - (targetLayerBottom - currLayerBottom)
                : 0
    }

    if (currLayerRight < targetLayerRight) {
        targetLayer.structure.width =
            targetLayer.structure.width - (targetLayerRight - currLayerRight) > 0
                ? targetLayer.structure.width - (targetLayerRight - currLayerRight)
                : 0
    }
    return targetLayer.structure.width * targetLayer.structure.height
}
