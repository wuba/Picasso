const sizeOf = require('image-size');
const handleSizeByArtboard = require('./handleSizeByArtboard');
/**
 *
 * 修正shadows引起的图片尺寸问题
 *
 *
 * @param {*} layer 图层
 * @param {*} imgPath 导出图片路径
 */
module.exports = (layer, imgPath, imgScale) => {
    let { width, height } = sizeOf(imgPath);
    //获取缩放的比例
    let sizeX = layer.frame.width / layer.frame.imgWidth;
    let sizeY = layer.frame.height / layer.frame.imgHeight;
    layer.frame = handleSizeByArtboard(layer.frame);
    if (layer.realFrame) {
        sizeX = layer.realFrame.width / layer.frame.imgWidth;
        sizeY = layer.realFrame.height / layer.frame.imgHeight;
        layer.realFrame = { ...layer.frame };
    }
    width = width * sizeX;
    height = height * sizeY;
    layer.frame = {
        x: layer.frame.x - (width / imgScale - layer.frame.width) * 0.5,
        y: layer.frame.y - (height / imgScale - layer.frame.height) * 0.5,
        width: width / imgScale,
        height: height / imgScale
    }
    if (layer.style && layer.style.shadows) {
        let shadowArr = layer.style.shadows.filter(item => item.isEnabled);
        if (shadowArr.length > 0) {
            layer.frame.x += shadowArr[0].offsetX;
            layer.frame.y += shadowArr[0].offsetY;
        }
    }
}
