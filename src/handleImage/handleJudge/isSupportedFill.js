// TBD 需要改造
const isSupportedFill = (layer) => {
    if (
        !(
          layer.type === 'Artboard'
        ) &&
        layer.style
        && Array.isArray(layer.style?.fills)
        && layer.style?.fills?.length
        && layer.style.fills.filter(item => item.enabled).length > 0
    ) {
        // 处理填充 fills,fills是数组，只支持单个情况,处理成背景色, 文本的背景另外设置
        // 填充类型
        // fillStyle.fillType
        //       Color  纯色
        //       Gradient 渐变色
        //       Pattern 填充图
        // fillStyle.fillType fillStyle.gradient.gradientType
        //        Gradient  Linear   线性渐变色  完全css解析
        //        Gradient  Radial   径向渐变色  1.圆形或者椭圆但是没有倾斜角度的 css解析 2.导出为图片
        //        Gradient  Angular  直角渐变色  css实验属性暂时不支持 ，导出为图片

        const fills = layer.style.fills.filter(item => item.enabled);

        if (fills.length >= 2) {
            return false;
        }

        const fillStyle = fills[fills.length - 1];
        const { fillType } = fillStyle;

        if (layer.type === 'Text' && fillType != 'Color') {
            return false;
        }

        if (fillType == 'Pattern') {
            return false;
        }

        if (fillType == 'Gradient' && fillStyle.gradient) {
            const { gradient } = fillStyle;
            const { frame } = layer;
            const { gradientType } = gradient;

            if (gradientType === 'Radial') {
                // 径向渐变
                const startPoint = gradient.from;
                const startX = startPoint.x * frame.width;
                const startY = startPoint.y * frame.height;
                const endPoint = gradient.to;
                const endX = endPoint.x * frame.width;
                const endY = endPoint.y * frame.height;

                if (fillStyle.gradient.elipseLength > 0) {
                    // 椭圆渐变
                    if (
                        !(Math.abs(endY - startY) < 1 || Math.abs(endX - startX) < 1)
                    ) {
                        // 可解析
                        // 如果倾斜则 导出该图层
                        return false;
                    }
                }
            } else if (gradientType === 'Angular') {
                // 直角渐变色
                // 导出该图层
                return false;
            }
        }
    }

    return true;
};

export default isSupportedFill;
