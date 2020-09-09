let { createCanvas, loadImage } = require('canvas')
let canvas = createCanvas('canvas')

let ctx = canvas.getContext('2d');
let fs = require('fs')
let sizeOf = require('image-size');
/**
 * imgPath: 图片路径
 * degree: 旋转角度
 */
module.exports =async (imgPath, degree,rgba) => {
    let imgObj = await loadImage(imgPath);
    let dimensions = sizeOf(imgPath);
    let maxLen = Math.sqrt(Math.pow(dimensions.width, 2) + Math.pow(dimensions.height, 2)) + 200
    canvas.width = maxLen
    canvas.height = maxLen
    ctx.drawImage(imgObj, 50, 50, imgObj.width, imgObj.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(degree * Math.PI / 180);
    ctx.drawImage(imgObj, -imgObj.width / 2, -imgObj.width / 2);
    ctx.restore();
    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let lOffset = canvas.width,
        rOffset = 0,
        tOffset = canvas.height,
        bOffset = 0
    let borderPoint =Math.round((maxLen-dimensions.width)/2)-1;
    for (let i = 0; i < canvas.width; i++) {
        for (let j = 0; j < canvas.height; j++) {
            let pos = (i + canvas.width * j) * 4
            if (rgba) {
                let rgbaArr = rgba.split(',');
                let redVal = rgbaArr[0]/1;
                let greenVal =  rgbaArr[1]/1;
                let blueVal = rgbaArr[2]/1;
                if (!(imgData[pos]==0&&imgData[pos + 1]==0&&imgData[pos + 2]==0&&imgData[pos + 3]==0)&&!(imgData[pos] ==redVal && imgData[pos + 1] ==greenVal && imgData[pos + 2]==blueVal)&&
              i!=borderPoint &&j!=borderPoint) {
                // 说第j行第i列的像素不是透明的
                
                    bOffset = Math.max(j, bOffset) // 找到有色彩的最底部的纵坐标
                    rOffset = Math.max(i, rOffset) // 找到有色彩的最右端

                    tOffset = Math.min(j, tOffset) // 找到有色彩的最上端
                    lOffset = Math.min(i, lOffset) // 找到有色彩的最左端
                }
            }else{
                if (imgData[pos] > 0 || imgData[pos + 1] > 0 || imgData[pos + 2]>0 || imgData[pos + 3] > 0) {
                // 说第j行第i列的像素不是透明的
                // 楼主貌似底图是有背景色的,所以具体判断RGBA的值可以根据是否等于背景色的值来判断
                    bOffset = Math.max(j, bOffset) // 找到有色彩的最底部的纵坐标
                    rOffset = Math.max(i, rOffset) // 找到有色彩的最右端

                    tOffset = Math.min(j, tOffset) // 找到有色彩的最上端
                    lOffset = Math.min(i, lOffset) // 找到有色彩的最左端
                }
            }
            
        }
    }
    // 由于循环是从0开始的,而我们认为的行列是从1开始的
    // lOffset++
    // rOffset++
    // tOffset++
    // bOffset++
    // 意思是说包含有像素的区域是 左边第1行,到右边第100行,顶部第26行,到底部50行
    // 此时如果你想找到外部区域的话,就是 left和top减1  right和bottom加1的区域
    // 分别是0, 101, 25, 51.这个区间能够刚好包裹住
    let canvas2 = createCanvas("canvas")
    let cxt2 = canvas2.getContext("2d");
    canvas2.width =Math.abs(rOffset - lOffset+2);
    canvas2.height =Math.abs(bOffset - tOffset+2);
    let dataImg = ctx.getImageData(lOffset - 1, tOffset - 1, canvas2.width, canvas2.height);
    cxt2.putImageData(dataImg, 0, 0, 0, 0, canvas2.width, canvas2.height)
    let img2 = canvas2.toDataURL("image/png");
    let base64Data = img2.replace(/^data:image\/\w+;base64,/, "");
    let dataBuffer = new Buffer(base64Data, 'base64');
    fs.writeFileSync(imgPath, dataBuffer);
}
