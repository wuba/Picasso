/**
 * fillStyle.patternFillType == 0   Mask_Tile repeat 平铺
 * fillStyle.patternFillType == 1  Mask_Fill  cover  填充
 * fillStyle.patternFillType == 2  Mask_Stretch  100% 100% 拉伸
 * fillStyle.patternFillType == 3   Mask_Fit  contain 包含
 */
module.exports = (fillStyle, record, layer) => {
    if (!fillStyle.image) {
        return;
    }
    if (fillStyle.patternFillType == 0) {
        layer.maskStyle = {
            'background-repeat': 'repeat'
        }
    }
    if (fillStyle.patternFillType == 1) {
        layer.maskStyle = {
            'background-repeat': 'no-repeat',
            'background-position': 'center center',
            'background-size': 'cover'
        }
    }
    if (fillStyle.patternFillType == 2) {
        layer.maskStyle = {
            'background-repeat': 'no-repeat',
            'background-position': 'center center',
            'background-size': '100% 100%'
        }
    }
    if (fillStyle.patternFillType == 3) {
        layer.maskStyle = {
            'background-repeat': 'no-repeat',
            'background-position': 'center center',
            'background-size': 'contain'
        }
    }
    if (layer.realFrame) {
        let realFrame = JSON.parse(JSON.stringify(layer.realFrame));
        layer.maskStyle['background-position'] = `${realFrame.x - layer.frame.x}px ${realFrame.y - layer.frame.y}px`;
        layer.maskStyle['background-size'] = `${realFrame.width}px ${realFrame.height}px`;
        layer.maskStyle['background-repeat'] = 'no-repeat';
    }
    record.element = {
        type: 'img',
        val: fillStyle.image._ref.slice(fillStyle.image._ref.lastIndexOf('/') + 1)
    }
    if (!/.(png|pdf)$/.test(record.element.val)) {
        record.element.val = record.element.val + '.png';
    }
    record.type = 'Image';
    record.value = record.element.val;
    //图片类型，背景色去掉
    delete record.style['background-color'];
}
