function calculateRGB(color) {
    return Math.round(color * 255);
}

function uniqueId() {
    return Math.random().toString(32).substr(2, 8);
}

// 两个元素进行比较， 判断一个是否在另一个中间的位置
function isAlignCenter(com1, com2) {
    return Math.abs((com1.x + com1.width / 2) - (com2.x + com2.width / 2)) <= 5
}

// 判断是否包含可用的 fill
function getEnabledFill(layer) {
    let list = [];
    if (layer.style && layer.style.fills && layer.style.fills.length) {
        layer.style.fills.map(item => {
            if (item.isEnabled) {
                list.push(item)
            }
        });
    }

    return list.length ? list[list.length - 1] : null; // 获取最上面一个可用的图层
}

/**
 * 获取 fill 计算之后的颜色值
 * @param {Object} fillObj
 */
function getFillColor(fillObj) {
    let {
        alpha,
        red,
        green,
        blue
    } = fillObj.color;
    return `rgba(${calculateRGB(red)},${calculateRGB(green)},${calculateRGB(blue)},${alpha})`
}

/**
 * 获取带单位的数值部分
 * @param {*} mixValue 带单位的数值
 * 
 */
function getValue(mixValue) {
    return mixValue ? parseInt(mixValue) : mixValue;
}

// 判断是否有交叉
function isMixed(target, container) {
    let targetLeft = target.x,
        targetRight = target.x + target.width,
        targetTop = target.y,
        targetBottom = target.y + target.height,
        containerLeft = container.x,
        containerRight = container.x + container.width,
        containerTop = container.y,
        containerBottom = container.y + container.height;

    if (targetRight <= containerLeft || targetBottom <= containerTop || containerRight <= targetLeft || containerBottom <= targetTop) {
        return false;
    }
    return true;
}

module.exports = {
    isMixed,
    getValue,
    uniqueId,
    calculateRGB,
    getFillColor,
    isAlignCenter,
    getEnabledFill
}
