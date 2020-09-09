const images = require('images');

/**
 * 长图剪切为多张图片
 * @param {String} imgPath 需要剪切的图片路径
 * @param {Number} maxHeight 图片高度大于多少时剪切
 * @param {String} outPath 剪切后的图片存放位置
 */
const imageShear = (imgPath='./parser/src/handleSketchFile/images/htmlScreenshot.png',maxHeight=1000) =>{
    // 原始图片对象
    const imgObj = images(imgPath);
    const width = imgObj.width();
    const height = imgObj.height();
    // 如果图片设置了最大高度
    if (maxHeight&&maxHeight<height) {
        const num = Math.ceil(height/maxHeight);
        const aveHeight =  Math.ceil(height/num);
        for (let i = 0; i < num; i++) {
            let currX = 0;
            let currY = aveHeight*i;
            let currHeight = '';
            let currWidth = width;
            // 最后一张截图
            if (i === num-1) {
                currHeight = height-(num-1)*aveHeight;
            } else {
                currHeight = aveHeight;
            }
            console.log(currX, currY, currWidth, currHeight);
            images(imgObj, currX, currY, currWidth, currHeight).save(`./parser/src/handleSketchFile/images/${i}.png`);
        }
    }
}
imageShear();
