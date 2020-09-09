/**
 * 基础坐标计算
 * @param {*} data
 * @param {*} groupX
 * @param {*} groupY
 * @param {*} sizeX
 * @param {*} sizeY
 */
const calculateCoordinate = (data, groupX = 0, groupY = 0, sizeX = 1, sizeY = 1, groupOpacity = 1, parentList = []) => {
    let bg = '0-0-0-0';
    if (data.backgroundColor && data.hasBackgroundColor && data.includeBackgroundColorInExport) {
        let { red, green, blue, alpha } = data.backgroundColor;
        bg = `${red}-${green}-${blue}-${alpha}`;
    }
    let currParentList = [`${data.frame.x},${data.frame.y},${data.frame.imgWidth},${data.frame.imgHeight},${data.do_objectID},${data._class},${bg}`, ...parentList];

    // if (!data.layers) return [];
    for (let i = 0; i < data.layers.length; i++) {
        let layer = data.layers[i];
        if (layer.style && layer.style.borders && layer._class != 'artboard') {
            let borderList = layer.style.borders.filter(item => item.isEnabled);
            if (borderList.length == 1) {
                let borderStyle = borderList[0];
                if (borderStyle.position == 0) { // 中间边框
                    let w = borderStyle.thickness / 2;
                    layer.frame.width += borderStyle.thickness;
                    layer.frame.height += borderStyle.thickness;
                    layer.frame.x -= w;
                    layer.frame.y -= w;
                } else if (borderStyle.position == 2) { // 外边框
                    let w = borderStyle.thickness;
                    layer.frame.width += w * 2;
                    layer.frame.height += w * 2;
                    layer.frame.x -= w;
                    layer.frame.y -= w;
                }
            }
        }
        layer.parentList = currParentList;

        let x, y, width, height;

        if (layer.frame) {
            //坐标需要处理，需要加上父组的累计坐标
            x = layer.frame.x * sizeX + groupX;
            y = layer.frame.y * sizeY + groupY;
            width = layer.frame.width * sizeX;
            height = layer.frame.height * sizeY;
        }
        //透明度传递
        if (!layer.style) {
            layer.style = {};
        }
        if (!layer.style.contextSettings) {
            layer.style.contextSettings = {};
        }
        if (layer.style.contextSettings.opacity === undefined) {
            layer.style.contextSettings.opacity = 1;
        }
        layer.style.contextSettings.opacity = layer.style.contextSettings.opacity * groupOpacity;
        let currGroupX = groupX + layer.frame.x * sizeX;
        let currGroupY = groupY + layer.frame.y * sizeY;
        let currGroupOpacity = layer.style.contextSettings.opacity;

        layer.frame.x = x;
        layer.frame.y = y;
        layer.frame.imgWidth = layer.frame.width;
        layer.frame.imgHeight = layer.frame.height;
        layer.frame.width = width;
        layer.frame.height = height;
        layer.frame.sizeX = sizeX;
        layer.frame.sizeY = sizeY;
        //基础缩放比例计算
        let currSizeX = sizeX;
        let currSizeY = sizeY;

        if (layer._class == 'symbolInstance' && layer.layers && layer.layers[0] && layer.layers[0]._class == 'symbolMaster') {
            let symbolInstanceRect = layer.frame;
            let symbolMasterRect = layer.layers[0].frame;
            currSizeX = symbolInstanceRect.width / symbolMasterRect.width;
            currSizeY = symbolInstanceRect.height / symbolMasterRect.height;
        }

        if (Array.isArray(layer.layers) && layer.layers.length) {
            calculateCoordinate(layer, currGroupX, currGroupY, currSizeX, currSizeY, currGroupOpacity, currParentList);
        }
    }

    return data;
}

module.exports = calculateCoordinate;
