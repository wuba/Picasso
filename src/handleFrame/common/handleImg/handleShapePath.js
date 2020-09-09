/**
 * 不规则图形处理
 * 
 */
const fs = require('fs');
const sizeOf = require('image-size');
const fileSystem = require('file-system');
const {
    IMG_SCALE_UNIT
} = require('../../../common/global');

const exportFullSlice = require('../../../handleSketchFile/exportShape/exportFullSlice');
const getSliceFrame = require('../../../handleSketchFile/getSliceFrame');

const handleShapePathBefore = async (data, sketchId, sketchName, artboardIndex, imgInfoList, imgScale) => {
    const cliSketchParseResultPath = global.globalPath.cliSketchParseResultPath;
    if (Array.isArray(data.layers)) {
        for (let i = 0; i < data.layers.length; i++) {
            let layer = data.layers[i];
            if (layer._class != 'artboard' && fs.existsSync(`${cliSketchParseResultPath}/${sketchId}/shape`) && fs.existsSync(`${cliSketchParseResultPath}/${sketchId}/shape/${layer.do_objectID}${IMG_SCALE_UNIT[imgScale]}.png`)) {
                let imgPath = `${cliSketchParseResultPath}/${sketchId}/shape/${layer.do_objectID}${IMG_SCALE_UNIT[imgScale]}.png`;
                // 获取导出图片尺寸
                let { width, height } = sizeOf(imgPath);
                // x方向缩放比例
                let sizeX = layer.frame.width / layer.frame.imgWidth;
                // y方向缩放比例
                let sizeY = layer.frame.height / layer.frame.imgHeight;
                // 宽或者高相比图层本身的宽高 误差>2即视为不匹配=> 重新获取图层大小和位置
                if (Math.abs(sizeX * width / imgScale - layer.frame.width) > 2 || Math.abs(sizeY * height / imgScale - layer.frame.height) > 2) {
                    //查找满足条件最近父元素
                    let parentObj = {
                        x: data.frame.x,
                        y: data.frame.y,
                        do_objectID: data.do_objectID
                    };
                    let parentList = [];
                    for (let n = 0; n < layer.parentList.length; n++) {
                        let currItem = layer.parentList[n].split(',');
                        let object_id = currItem[4];
                        parentList.push(object_id);
                        //父元素为只能为画板或者symbolMaster，其他元素的大小可能不精确(旋转或者截取造成)
                        if (currItem[5] == 'artboard' || currItem[5] == 'symbolMaster') {
                            parentObj = {
                                x: currItem[0],
                                y: currItem[1],
                                do_objectID: object_id
                            }
                            break;
                        }
                    }
                    imgInfoList.push({
                        parentId: parentObj.do_objectID,
                        layerId: `${layer.do_objectID}_${layer.frame.x - parentObj.x}_${layer.frame.y - parentObj.y}`,
                        parentList: parentList.join(','),
                    })
                }
            }
            if (layer.layers && layer.layers.length) {
                await handleShapePathBefore(layer, sketchId, sketchName, artboardIndex, imgInfoList, imgScale)
            }
        }
    }


    return data;
}

const handleShapePathAfter = async (data, sketchId, sketchName, artboardIndex, imgInfoList, imgScale) => {
    const cliSketchParseResultPath = global.globalPath.cliSketchParseResultPath;
    const cliShapePath = global.globalPath.cliShapePath;
    if (Array.isArray(data.layers)) {
        for (let i = 0; i < data.layers.length; i++) {
            let layer = data.layers[i];
            if (layer._class != 'artboard' && fs.existsSync(`${cliSketchParseResultPath}/${sketchId}/shape`) && fs.existsSync(`${cliSketchParseResultPath}/${sketchId}/shape/${layer.do_objectID}${IMG_SCALE_UNIT[imgScale]}.png`)) {
                let imgPath = `${cliSketchParseResultPath}/${sketchId}/shape/${layer.do_objectID}${IMG_SCALE_UNIT[imgScale]}.png`;
                // 获取导出图片尺寸
                let { width, height } = sizeOf(imgPath);
                // x方向缩放比例
                let sizeX = layer.frame.width / layer.frame.imgWidth;
                // y方向缩放比例
                let sizeY = layer.frame.height / layer.frame.imgHeight;
                // 宽或者高相比图层本身的宽高 误差>2即视为不匹配=> 重新获取图层大小和位置
                if (Math.abs(sizeX * width / imgScale - layer.frame.width) > 2 || Math.abs(sizeY * height / imgScale - layer.frame.height) > 2) {
                    //查找满足条件最近父元素
                    let parentObj = {
                        x: data.frame.x,
                        y: data.frame.y,
                        do_objectID: data.do_objectID
                    };
                    for (let n = 0; n < layer.parentList.length; n++) {
                        let currItem = layer.parentList[n].split(',');
                        let object_id = currItem[4];
                        //父元素为只能为画板或者symbolMaster，其他元素的大小可能不精确(旋转或者截取造成)
                        if (currItem[5] == 'artboard' || currItem[5] == 'symbolMaster') {
                            parentObj = {
                                x: currItem[0],
                                y: currItem[1],
                                do_objectID: object_id
                            }
                            break;
                        }
                    }
                    let parentImgPath = `${cliShapePath}/${layer.do_objectID}.png`;
                    let { x, y } = await getSliceFrame(parentImgPath);
                    layer.frame = {
                        x: sizeX * x + parentObj.x / 1,
                        y: sizeY * y + parentObj.y / 1,
                        width: sizeX * width / imgScale,
                        height: sizeY * height / imgScale
                    }
                }
                layer._class = 'bitmap';
                layer.style = {};
                layer.layers = [];
                layer.isFlippedHorizontal = false;
                layer.isFlippedVertical = false;
                layer.rotation = 0;
                layer.image = {
                    "_class": "sliceImg",
                    "_ref_class": "MSImageData",
                    "_ref": `images\/${layer.do_objectID}.png`
                }
                fileSystem.writeFileSync(`${cliSketchParseResultPath}/${sketchId}_${artboardIndex}/images/${layer.do_objectID}.png`, fileSystem.readFileSync(`${cliSketchParseResultPath}/${sketchId}/shape/${layer.do_objectID}${IMG_SCALE_UNIT[imgScale]}.png`));
            }
            if (layer.layers && layer.layers.length) {
                await handleShapePathAfter(layer, sketchId, sketchName, artboardIndex, imgInfoList, imgScale)
            }
        }
    }
    return data;
}

/**
 * 处理不规则图形
 */
module.exports = async (data, sketchId, sketchName, artboardIndex, imgScale) => {
    const cliSketchParseResultPath = global.globalPath.cliSketchParseResultPath;
    const cliShapePath = global.globalPath.cliShapePath;
    let sketchPath = `${cliShapePath}/${sketchName}.sketch`;
    fileSystem.copyFileSync(`${cliSketchParseResultPath}/${sketchId}/${sketchName}.sketch`, sketchPath);
    const imgInfoList = [];
    await handleShapePathBefore(data, sketchId, sketchName, artboardIndex, imgInfoList, imgScale);
    if (imgInfoList.length > 0) {
        try {
            await exportFullSlice(sketchPath, imgInfoList);
        } catch (error) {
            console.log(error);
        }
    }
    try {
        await handleShapePathAfter(data, sketchId, sketchName, artboardIndex, imgInfoList, imgScale);
    } catch (error) {
        console.log('handleShapePathAfter', error);
    }
    return data;
};
