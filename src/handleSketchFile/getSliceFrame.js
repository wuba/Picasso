
let fs = require('fs')
const getPixels = require('./getPixels');
/**
 * 测量子元素到父元素位置
 *
 * @param {String} imgPath
 *  backgroundColor = {
      alpha:0,
      red:0,
      green:0,
      blue:0
    }
 * @returns
 */
module.exports = async (imgPath) => {
    /**
     * 图片尺寸处理时，sketch插件已将导出容器图的背景设置为rbga(0,0,0,0);
     */
    const backgroundColor = {
        alpha:0,
        red:0,
        green:0,
        blue:0
    };
    let {alpha,red,green,blue} = backgroundColor;
    let {width,height,imgData} = await getPixels(imgPath);
    let lOffset = width,tOffset = height;
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            let pos = (i + width * j) * 4;
            if (Math.abs(imgData[pos]- red*255)>=1 || Math.abs(imgData[pos + 1]-green*255)>=1 || Math.abs(imgData[pos + 2]-blue*255)>=1 || Math.abs(imgData[pos + 3] - alpha*255)>=1) {
                // 说第j行第i列的像素不是透明的
                tOffset = Math.min(j, tOffset) // 找到有色彩的最上端
                lOffset = Math.min(i, lOffset) // 找到有色彩的最左端
            }
        }
    }
    //删除使用后的图
    if (fs.existsSync(imgPath)) {
        // fs.unlinkSync(imgPath);
    }
    return {
        x:lOffset,
        y:tOffset
    }
}
