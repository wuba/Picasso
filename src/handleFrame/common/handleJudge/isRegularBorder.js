// 判断是否有边框
const isRegularBorder = (layer) => {
    if (layer.style && layer.style.borders && layer.style.borders.length) {
        // 获取激活的所有边框
        let borderList = layer.style.borders.filter(item => item.isEnabled)
        // 多层边框
        if (borderList.length > 1) {
            return false
        } else if (borderList.length == 1) { // 单层边框
            let border = borderList[0];
            // fillType: 0 纯色填充
            // fillType: 1 线性渐变填充|径向纯色填充|锥形渐变
            if (border.fillType == 1) {
                return false
            }
        }
        return true;
    }
    return true
}

module.exports = isRegularBorder;