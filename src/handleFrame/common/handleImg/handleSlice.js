const fs = require('fs');
const sizeOf = require('image-size');
const {
    IMG_SCALE_UNIT,
} = require('../../../common/global');

const handleImgSize = require('./handleImgSize');
const handleSizeByArtboard = require('./handleSizeByArtboard');

const handleSlice = async (data, sketchId, sketchName, artboardIndex, artboardName, imgScale) => {
    if (!data.layers) return [];
    const cliSketchParseResultPath = global.globalPath.cliSketchParseResultPath;

    for (let j = 0; j < data.layers.length; j++) {
        let layer = data.layers[j];
        if (layer._class == 'slice') {
            try {
                let flag = true;
                const fileFormat = `${IMG_SCALE_UNIT[imgScale]}.png`;
                let imgPath = `${cliSketchParseResultPath}/${sketchId}/slices/${layer.do_objectID}${fileFormat}`;
                let { width, height } = sizeOf(imgPath);
                //获取缩放的比例
                let sizeX = layer.frame.width / layer.frame.imgWidth;
                let sizeY = layer.frame.height / layer.frame.imgHeight;
                width = width * sizeX;
                height = height * sizeY;
                layer.frame = handleSizeByArtboard(layer.frame);
                if (flag == true && (layer.rotation % 180 != 0 || (Math.abs(width / imgScale - layer.frame.width) <= 1.5 && Math.abs(height / imgScale - layer.frame.height) <= 1.5))) {
                    handleImgSize(layer, imgPath, imgScale);
                }
                let outputImgName = `${layer.do_objectID}${fileFormat}`;
                if (!fs.existsSync(`${cliSketchParseResultPath}/${sketchId}_${artboardIndex}/images`)) {
                    fs.mkdirSync(`${cliSketchParseResultPath}/${sketchId}_${artboardIndex}/images`)
                }
                if (fs.existsSync(imgPath)) {
                    fs.writeFileSync(`${cliSketchParseResultPath}/${sketchId}_${artboardIndex}/images/${outputImgName}`, fs.readFileSync(imgPath));
                    layer._class = 'bitmap';
                    layer.isFlippedHorizontal = false;
                    layer.isFlippedVertical = false;
                    layer.style = {};
                    layer.layers = [];
                    //切片的border删除，因为切片已经包含样式
                    if (layer.style && layer.style.borders) {
                        layer.style.borders = [];
                    }
                    layer.image = {
                        "_class": "sliceImg",
                        "_ref_class": "MSImageData",
                        "_ref": `images\/${outputImgName}`
                    }
                }
            } catch (error) {
                // console.log(error);
            }
        }
        //子元素为切片
        if (layer.layers && layer.layers.length > 0) {
            for (let i = 0; i < layer.layers.length; i++) {
                if (layer.layers[i]._class == 'slice' && layer.layers[i].isVisible) {
                    let currSliceFrame = layer.layers[i].frame;
                    for (let j = 0; j < layer.layers.length; j++) {
                        if (layer.layers[j]._class != 'slice' &&
                            layer.layers[j].isVisible &&
                            layer.layers[j].frame
                        ) {
                            let currFrame = layer.layers[j].frame;
                            if (currFrame.x >= currSliceFrame.x &&
                                currFrame.y >= currSliceFrame.y &&
                                currFrame.x + currFrame.width <= currSliceFrame.x + currSliceFrame.width &&
                                currFrame.y + currFrame.height <= currSliceFrame.y + currSliceFrame.height
                            ) {
                                layer.layers[j].isVisible = false;
                            }
                        }
                    }
                }
            }
        }
        if (Array.isArray(layer.layers) && layer.layers.length > 0) {
            await handleSlice(layer, sketchId, sketchName, artboardIndex, artboardName, imgScale)
        }
    }
    return data;
}

module.exports = handleSlice;
