
const handleIregularLayer = require('./handleIregularLayer');

/**
 * 计算导出图层
 */
const calculateExportLayer = (data, exportLayerList) => {
    for (let i = 0; i < data.layers.length; i++) {
        let layer = data.layers[i];
        handleIregularLayer(layer, data, exportLayerList);
        if ((layer._class == 'symbolInstance' && layer.layers && layer.layers.length == 0) || (layer._class == 'symbolInstance' && !layer.layers)) {
            layer.isRegular = false;
            layer.layers = [];
        }
        if (layer._class != 'slice' && layer._class != 'artboard' && layer.exportOptions && layer.exportOptions.exportFormats && layer.exportOptions.exportFormats.length > 0) {
            if (layer._class != 'symbolInstance') {
                layer.isRegular = false;
                layer.layers = [];
                //当symbolInstance被标记为导出时，应该导出对应的symbolMaster，而symbolInstance不做处理
            } else if (layer.layers && layer.layers.length == 1 && layer.layers[0]._class == 'symbolMaster') {
                layer.layers[0].isRegular = false;
            }
        }

        //去掉没使用的填充
        if (layer.style && Array.isArray(layer.style.fills) && layer.style.fills.length) {
            layer.style.fills = layer.style.fills.filter(fillItem => {
                return fillItem.isEnabled
            })
        }
        //去掉无用的边框
        if (layer.style && Array.isArray(layer.style.borders) && layer.style.borders.length > 0) {
            layer.style.borders = layer.style.borders.filter(borderItem => {
                return borderItem.isEnabled
            })
        }
        //去掉border是虚线的情况 css无对应解析力度
        if (layer.style && layer.style.borderOptions && layer.style.borderOptions.isEnabled && Array.isArray(layer.style.borders) && layer.style.borders.length > 0) {
            layer.isRegular = false;
        }
        if ((!(layer._class == 'artboard'||(layer.backgroundColor && layer.hasBackgroundColor)))&&layer.style && Array.isArray(layer.style.fills) && layer.style.fills.length && layer.style.fills[layer.style.fills.length - 1].isEnabled) { // 处理填充 fills,fills是数组，只支持单个情况,处理成背景色, 文本的背景另外设置
            // 填充类型
            // fillStyle.fillType  
            //           0  纯色
            //           1  渐变色  
            //           2  
            //           3
            //           4  填充图
            //           5  纹理效果
            // fillStyle.fillType fillStyle.gradient.gradientType 
            //        1                    0   线性渐变色  完全css解析
            //        1                    1   径向渐变色  1.圆形或者椭圆但是没有倾斜角度的 css解析 2.导出为图片
            //        1                    2   直角渐变色  css实验属性暂时不支持 ，导出为图片
            const fillStyle = layer.style.fills[layer.style.fills.length - 1];
            const fillType = fillStyle.fillType;
            if (layer._class == 'text') {
                if (fillType != 0) {
                    layer.isRegular = false;
                }
            } else {
                if (layer._class == 'bitmap') {
                    layer.frame.imgHeight = layer.frame.height;
                    layer.frame.imgWidth = layer.frame.width;
                    layer.realFrame = { ...layer.frame };
                    layer.isRegular = false;
                } else if (layer.style.fills.length >= 2) {
                    layer.isRegular = false;
                } else if (fillType == 5 || fillType == 4) {
                    layer.isRegular = false;
                } else if (fillType == 1 && fillStyle.gradient) {
                    let gradient = fillStyle.gradient;
                    let frame = layer.frame;
                    let gradientType = gradient.gradientType;
                    if (gradientType == 1) {//径向渐变
                        let startPointStr = gradient.from;
                        let startX = +startPointStr.split('{')[1].split(',')[0] * frame.width;
                        let startY = -startPointStr.split(',')[1].split('}')[0] * frame.height;
                        let endPointStr = gradient.to;
                        let endX = +endPointStr.split('{')[1].split(',')[0] * frame.width;
                        let endY = -endPointStr.split(',')[1].split('}')[0] * frame.height;
                        if (fillStyle.gradient.elipseLength > 0) {//椭圆渐变
                            if (!((Math.abs(endY - startY) < 1)||(Math.abs(endX - startX) < 1))) { //可解析
                                //如果倾斜则 导出该图层
                                layer.isRegular = false;
                            }
                        }
                    } else if (gradientType == 2) {//直角渐变色
                        // 导出该图层
                        layer.isRegular = false;
                    }
                }
            }
        }
        if (!layer.isRegular && layer.hasClippingMask && data._class != 'artboard') { // 如果是不规则的遮罩，且父元素不为画板
            data.isRegular = false;
            exportLayerList.push(data.do_objectID);
            data.layers = [];
        }
        //组中只有一个Mask
        if (layer.layers && layer.layers.length > 0 && layer.layers[0].hasClippingMask) {
            let layerList = layer.layers;
            let flagImg = false;
            let flag = true;
            for (let i = 1; i < layerList.length; i++) {
                const currCLass = layerList[i]._class;
                if (layerList[i].isVisible && currCLass == 'bitmap') {
                    flagImg = true;
                }
                if (layerList[i].isVisible && currCLass != 'bitmap' && currCLass != 'rectangle') {
                    flag = false;
                }
            }
            if (flagImg && flag) {
                layer.isRegular = false;
                layer.layers = [];
            }
        }
        if (!layer.isRegular) {
            exportLayerList.push(layer.do_objectID)
        }
        if (layer.layers && layer.layers.length) {
            calculateExportLayer(layer, exportLayerList)
        }
    }
}

module.exports = (data) => {
    let exportLayerList = [];
    calculateExportLayer(data, exportLayerList);
    return exportLayerList;
}
