import { SKLayer,SKFillItem,Background } from '../../../types';
/**
 * fillStyle.patternFillType == 0   Mask_Tile repeat 平铺
 * fillStyle.patternFillType == 1  Mask_Fill  cover  填充
 * fillStyle.patternFillType == 2  Mask_Stretch  100% 100% 拉伸
 * fillStyle.patternFillType == 3   Mask_Fit  contain 包含
 */
export default (fillStyle: SKFillItem, layer: SKLayer):Background => {
    const background: Background = {};

    if (!fillStyle.image) {
        return;
    }

    if (fillStyle.patternFillType == 0) {
        background.repeat = 'repeat';
    }

    if (fillStyle.patternFillType == 1) {
        background.repeat = 'no-repeat';
        background.position = {
            left: 'center',
            top: 'center'
        }
        background.size = 'cover';
    }

    if (fillStyle.patternFillType == 2) {
        background.repeat = 'no-repeat';
        background.position =  {
            left: 'center',
            top: 'center'
        };
        background.size = {
            width: '100%',
            height: '100%',
        }
    }

    if (fillStyle.patternFillType == 3) {
        background.repeat = 'no-repeat';
        background.position =  {
            left: 'center',
            top: 'center'
        };
        background.size = 'contain';
    }

    // TODO
    // if (layer.realFrame) {
    //     const realFrame = JSON.parse(JSON.stringify(layer.realFrame));
    //     layer.maskStyle['background-position'] = `${realFrame.x - layer.frame.x}px ${realFrame.y - layer.frame.y}px`;
    //     layer.maskStyle['background-size'] = `${realFrame.width}px ${realFrame.height}px`;
    //     layer.maskStyle['background-repeat'] = 'no-repeat';
    // }

    let imgPath = fillStyle.image._ref.slice(fillStyle.image._ref.lastIndexOf('/') + 1);

    if (!/.(png|pdf)$/.test(imgPath)) {
        imgPath = imgPath + '.png';
    }

    background.image = {
        url: imgPath 
    }
    //图片类型，背景色去掉
    // TODO
    // delete record.style['background-color'];

    return background;
}
