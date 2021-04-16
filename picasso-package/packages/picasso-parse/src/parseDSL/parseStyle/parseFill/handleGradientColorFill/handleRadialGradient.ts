import twoPointsDistance from './twoPointsDistance';
import { SKGradient,SKLayer, RadialGradient,GListItem,SKFillItem } from '../../../../types';
import {
    precisionControl,
    transSketchColor
} from '../../../../common/utils';

export default (gradient: SKGradient, layer: SKLayer, fillStyle:SKFillItem, contextSettings = 1):RadialGradient => {
    let frame = layer.frame;
    let startPointStr = gradient.from;
    let startX = +startPointStr.split('{')[1].split(',')[0] * frame.width;
    let startY = -startPointStr.split(',')[1].split('}')[0] * frame.height;
    let endPointStr = gradient.to;
    let endX = +endPointStr.split('{')[1].split(',')[0] * frame.width;
    let endY = -endPointStr.split(',')[1].split('}')[0] * frame.height;
    let r = Math.abs(twoPointsDistance(startX, startY, endX, endY));
    let stops = gradient.stops;
    const valList: GListItem[] = stops.map(({
        color,
        position
    }): GListItem => {
        let {
            red,
            green,
            blue,
            alpha
        } = color;

        if (layer.style&&layer.style.contextSettings) {
            alpha = layer.style.contextSettings.opacity * contextSettings * alpha;
        }
        return {
            color: transSketchColor({red, green, blue, alpha}),
            position: precisionControl(position,0.01),
        }
    });
    if (fillStyle.gradient.elipseLength > 0) { //椭圆渐变
        let elipseLength = fillStyle.gradient.elipseLength;
        if (Math.abs(endY - startY) < 1) {
            return {
                smallRadius: precisionControl(r),
                largeRadius: precisionControl(elipseLength * r),
                position: {
                    left: precisionControl(startX),
                    top: precisionControl(-startY),
                },
                gList: valList
            }
        } else if (Math.abs(endX - startX) < 1) {
            return {
                smallRadius: precisionControl(elipseLength * r),
                largeRadius: precisionControl(r),
                position: {
                    left: precisionControl(startX),
                    top: precisionControl(-startY),
                },
                gList: valList
            }
        }
    } else { //圆形渐变
        return {
            smallRadius: precisionControl(r),
            largeRadius: precisionControl(r),
            position: {
                left: precisionControl(startX),
                top: precisionControl(-startY),
            },
            gList: valList
        }
    }
}
