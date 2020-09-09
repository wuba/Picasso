
const exportSketchImage = require('./exportSketchImage');
const {getArtboardsList} = require('../common/sketchTools');
/**
 * sketch=>画板列表
 */
module.exports = async (sketchId, sketchName) => {
    await exportSketchImage(sketchId, sketchName);
    return getArtboardsList(sketchId, sketchName);
}
