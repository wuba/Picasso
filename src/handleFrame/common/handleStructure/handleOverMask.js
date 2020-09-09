/**
 * 处理超出 mask 的元素做剪切
 * @param {*} target 被比较的层级
 * @param {*} maskLayer mask 层级
 */
module.exports = (target, maskLayer) => {
    if (!target.frame || !maskLayer.frame) {
        return;
    }
    let targetLeft = target.frame.x,
        targetRight = target.frame.x + target.frame.width,
        targetTop = target.frame.y,
        targetBottom = target.frame.y + target.frame.height,
        maskLayerLeft = maskLayer.frame.x,
        maskLayerRight = maskLayer.frame.x + maskLayer.frame.width,
        maskLayerTop = maskLayer.frame.y,
        maskLayerBottom = maskLayer.frame.y + maskLayer.frame.height;

    if (maskLayerLeft > targetLeft) {
        target.frame.x = maskLayer.frame.x;
        target.frame.width = (target.frame.width - (maskLayerLeft - targetLeft) > 0) ? target.frame.width - (maskLayerLeft - targetLeft) : 0;
    }

    if (maskLayerTop > targetTop) {
        target.frame.y = maskLayer.frame.y;
        target.frame.height = (target.frame.height - (maskLayerTop - targetTop) > 0) ? target.frame.height - (maskLayerTop - targetTop) : 0;
    }

    if (maskLayerBottom < targetBottom) {
        target.frame.height = (target.frame.height - (targetBottom - maskLayerBottom)) > 0 ? target.frame.height - (targetBottom - maskLayerBottom) : 0;
    }

    if (maskLayerRight < targetRight) {
        target.frame.width = (target.frame.width - (targetRight - maskLayerRight)) > 0 ? target.frame.width - (targetRight - maskLayerRight) : 0;
    }
    return target;
}
