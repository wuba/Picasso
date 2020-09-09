/**
 * 处理旋转及翻转group
 *  1.为矩形且旋转90度，这修改为旋转后的图形，消除旋转角度
 *   
 * @param {Object} layer 图层
 * @returns {Array} transform 旋转及翻转相关属性
 */
module.exports = (layer) => {
    let hasScale = true;
    if (layer._class == 'rectangle' && layer.rotation % 180 == 90) {
        let flag = false;
        if (layer.style && Array.isArray(layer.style.fills) && layer.style.fills.length && layer.style.fills[layer.style.fills.length - 1].isEnabled) {
            const fillStyle = layer.style.fills[layer.style.fills.length - 1];
            const fillType = fillStyle.fillType;
            if (fillType == 0) {
                flag = true;
            }
        } else {
            flag = true;
        }
        if (flag) {
            //转换前坐标
            let oldWidth = layer.frame.width;
            let oldHeight = layer.frame.height;
            let oldX = layer.frame.x;
            let oldY = layer.frame.y;
            //转换后坐标
            let newWidth = oldHeight;
            let newHeight = oldWidth;
            let newX = oldX + (oldWidth / 2 - oldHeight / 2);
            let newY = oldY - (oldWidth / 2 - oldHeight / 2);
            layer.frame = {
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight
            }
            if (Array.isArray(layer.style.shadows)) {
                layer.style.shadows = layer.style.shadows.map(item => {
                    if (layer.rotation % 360 == 90 && layer.rotation % 360 == -270) {
                        let offX = -item.offsetY;
                        item.offsetY = item.offsetX;
                        item.offsetX = offX;
                    } else {
                        let offX = item.offsetY;
                        item.offsetY = -item.offsetX;
                        item.offsetX = offX;
                    }
                    return item;
                });
            }
            return [];
        }
    }
    if (layer.style && Array.isArray(layer.style.fills) && layer.style.fills.length && layer.style.fills[layer.style.fills.length - 1].isEnabled && layer._class != 'text') {
        const fillStyle = layer.style.fills[layer.style.fills.length - 1];
        const fillType = fillStyle.fillType;
        if (fillType == 0 && layer._class == 'rectangle' && layer.rotation % 90 == 0) {
            hasScale = false;
        }
        if (layer.backgroundColor && layer.hasBackgroundColor && layer._class == 'rectangle' && layer.rotation % 90 == 0) {
            hasScale = false;
        }
    }
    let transform = [];
    if (hasScale == true) {
        if (layer.isFlippedHorizontal && layer.isFlippedVertical) {
            transform.push('scale(-1,-1)');
        } else if (layer.isFlippedHorizontal) {
            transform.push('scale(-1,1)');
        } else if (layer.isFlippedVertical) {
            transform.push('scale(1,-1)');
        }
        if (layer.rotation != undefined && layer.rotation != 0) {
            transform.push(`rotate(${-layer.rotation}deg)`);
        }
    } else {
        if (layer.rotation != undefined && layer.rotation != 0 && layer.rotation % 180 != 0) {
            transform.push(`rotate(${-layer.rotation}deg)`);
        }
    }
    layer.hasScale = hasScale;
    return transform;
}
