// 判断是否有边框
const isRegularBorder = (layer) => {
    if (layer.style?.borders && layer.style.borders.length) {
        // 获取激活的所有边框
        const borderList = layer.style.borders.filter(item => item.enabled);

        // 多层边框
        if (borderList.length > 1) {
            return false;
        }

        // fillType: Color 纯色填充
        // fillType: Gradient 线性渐变填充|径向纯色填充|锥形渐变
        if (borderList.length === 1 && borderList[0].fillType !== 'Color') { // 单层边框
            return false;
        }

        return true;
    }

    return true;
};

export default isRegularBorder;
