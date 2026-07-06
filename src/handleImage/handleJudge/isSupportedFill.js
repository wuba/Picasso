/**
 * 判断 Sketch 填充类型是否为图片/Pattern 填充。
 * @param {string|number} fillType Sketch DOM 的字符串类型，或 JSON 导出的数值类型。
 * @returns {boolean} true 表示该填充引用图片资源；false 表示不是图片填充。
 */
export const isPatternFillType = (fillType) => {
    return fillType === 'Pattern' || fillType === 'Image' || fillType === 4;
};

/**
 * 判断填充项是否启用。
 * @param {Object} fillStyle Sketch DOM 使用 enabled，JSON 导出使用 isEnabled。
 * @returns {boolean} true 表示该填充在设计稿中生效。
 */
export const isFillEnabled = (fillStyle) => {
    return !!(fillStyle && (fillStyle.enabled || fillStyle.isEnabled));
};

/**
 * 判断图片填充是否能保留为结构化背景图。
 * @param {Object} fillStyle 单个启用态 fill；需要包含 fillType 与 image 引用。
 * @returns {boolean} true 表示可由后续 DSL/RestoreDSL 解析为 background image。
 */
export const isSupportedPatternFill = (fillStyle) => {
    if (!fillStyle || !isPatternFillType(fillStyle.fillType)) {
        return false;
    }

    // 没有图片引用时无法生成 background-image，仍需要走切图保真。
    if (!fillStyle.image && !fillStyle.pattern && !fillStyle.patternImage) {
        return false;
    }

    // 0/1/2/3 分别对应 tile/fill/stretch/fit；缺省在 Sketch 中等价 fill。
    return fillStyle.patternFillType === undefined || [0, 1, 2, 3].includes(fillStyle.patternFillType);
};

/**
 * 判断图层填充是否能由结构化样式表达。
 * @param {Object} layer Sketch DOM 图层；读取 style.fills 的启用态填充。
 * @returns {boolean} true 表示解析器可保留结构；false 表示应导出为图片。
 */
const isSupportedFill = (layer) => {
    if (
        !(
          layer.type === 'Artboard'
        ) &&
        layer.style
        && Array.isArray(layer.style?.fills)
        && layer.style?.fills?.length
        && layer.style.fills.filter(isFillEnabled).length > 0
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

        const fills = layer.style.fills.filter(isFillEnabled);

        if (fills.length >= 2) {
            return false;
        }

        const fillStyle = fills[fills.length - 1];
        const { fillType } = fillStyle;

        if (layer.type === 'Text' && fillType != 'Color') {
            return false;
        }

        if (isPatternFillType(fillType)) {
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
