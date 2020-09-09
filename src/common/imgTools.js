const getPixels = require("get-pixels");
module.exports = {
    /**
     *
     *
     * @param {String} imgPath
     * @returns {Promise}
     * eg:
     * {
     *   width:50, //图片宽度
         height:50, //图片高度
         imgData:[] //图片像素数组
     * }
     */
    getImgInfo(imgPath) {
        return new Promise((resolve, reject) => {
            getPixels(imgPath, function (err, pixels) {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        width: pixels.shape[0],
                        height: pixels.shape[1],
                        imgData: pixels.data
                    });
                }
            })
        })
    },
    /**
     * 判断是否为纯色图片
     * 
     * @param {String} imgPath
     * @returns
     */
    async isPureColor(imgPath) {
        try {
            let { width, height, imgData } = await this.getImgInfo(imgPath);
            //初始颜色
            let defalutColor = {
                red: imgData[0],
                green: imgData[1],
                blue: imgData[2],
                alpha: imgData[3]
            };
            let isPure = true;
            //判断是否为纯色
            for (let i = 0; i < width; i++) {
                for (let j = 0; j < height; j++) {
                    let pos = (i + width * j) * 4;
                    if (imgData[pos] != defalutColor.red || imgData[pos + 1] != defalutColor.green || imgData[pos + 2] != defalutColor.blue || imgData[pos + 3] != defalutColor.alpha) {
                        isPure = false;
                        break;
                    }
                }
            }
            if (isPure) {
                return defalutColor;
            } else {
                return false;
            }
        } catch (error) {
            return false;
        }
    },
    /**
     * 判断两个图片之间是否有透出效果
     * 即:下面的那张被上面的那张完全透出
     * 
     * @param {String} upImgPath 上层覆盖的图片路径
     * @param {String} downImgPath 下层被覆盖的图片路径
     */
    async isTransparent(upImgPath, downImgPath, downX, downY) {
        try {
            let { upWidth, upImgData } = await this.getImgInfo(upImgPath);
            let { downWidth, downHeight, downImgData } = await this.getImgInfo(downImgPath);
            let isTrans = true;
            //循环被覆盖的图片像素
            for (let i = 0; i < downWidth; i++) {
                for (let j = 0; j < downHeight; j++) {
                    let pos = (i + downWidth * j) * 4;
                    //下面像素不透明
                    if (downImgData[pos] != 0 || downImgData[pos + 1] != 0 || downImgData[pos + 2] != 0 || downImgData[pos + 3] != 0) {
                        let upPos = (downX * 2 + i + upWidth * (j + downY * 2)) * 4;
                        //上面像素不透明
                        if (upImgData[upPos] != 0 || upImgData[upPos + 1] != 0 || upImgData[upPos + 2] != 0 || upImgData[upPos + 3] != 0) {
                            isTrans = false;
                            break;
                        }
                    }
                }
            }
            return isTrans;
        } catch (error) {
            return false;
        }
    }
}
