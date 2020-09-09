
/**
 * 根据画板来截取当前图层尺寸
 *
 * @param {Object} currFrame  当前图层
 * @returns {Object} currFrame  
 */
module.exports = (currFrame) => {
    let artboardFrame = global.artboardLayerFrame;

    //根据画板切片特性，修复坐标
    if (currFrame.x < artboardFrame.x) {
        currFrame.width = currFrame.width + currFrame.x - artboardFrame.x;
        currFrame.x = artboardFrame.x;
    }
    if (currFrame.y < artboardFrame.y) {
        currFrame.height = currFrame.height + currFrame.y - artboardFrame.y;
        currFrame.y = artboardFrame.y;
    }
    if (currFrame.x + currFrame.width > artboardFrame.x + artboardFrame.width) {
        currFrame.width = artboardFrame.x + artboardFrame.width - currFrame.x;
    }
    if (currFrame.y + currFrame.height > artboardFrame.y + artboardFrame.height) {
        currFrame.height = artboardFrame.y + artboardFrame.height - currFrame.y;
    }
    return currFrame
}