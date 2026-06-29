import twoPointsAngle from './twoPointsAngle';
import twoPointsDistance from './twoPointsDistance';
import { SKGradient,SKLayer, LinearGradient,GListItem } from '../../../../types';
import {
    precisionControl,
    transSketchColor
} from '../../../../common/utils';

export default (gradient:SKGradient, layer: SKLayer, contextSettings:number = 1): LinearGradient => {
    let frame = layer.frame;
    let changePointList = [];
    let startPointStr = gradient.from;
    let startX = +startPointStr.split('{')[1].split(',')[0] * frame.width;
    let startY = -startPointStr.split(',')[1].split('}')[0] * frame.height;
    let endPointStr = gradient.to;
    let endX = +endPointStr.split('{')[1].split(',')[0] * frame.width;
    let endY = -endPointStr.split(',')[1].split('}')[0] * frame.height;
    let gAngle = twoPointsAngle(startX, startY, endX, endY);
    let gDistance = twoPointsDistance(startX, startY, endX, endY);
    let startPoint = {
        x: startX,
        y: startY
    }
    let endPoint = {
        x: endX,
        y: endY
    }
    let stops = gradient.stops;
    if (endX < startX) {
        startPoint = {
            x: endX,
            y: endY
        }
        endPoint = {
            x: startX,
            y: startY
        }
        gAngle = twoPointsAngle(endX, endY, startX, startY);
        gDistance = twoPointsDistance(endX, endY, startX, startY);
        stops = stops.reverse();
        stops = stops.map(item => {
            item.position = 1 - item.position;
            return item;
        })
    }
    //图层矩形4点坐标
    type Point = {
        x: number
        y: number
    }
    let point1: Point = {
        x: 0,
        y: 0
    }
    let point2: Point = {
        x: frame.width,
        y: 0
    }
    let point3: Point = {
        x: frame.width,
        y: -frame.height
    }
    let point4: Point = {
        x: 0,
        y: -frame.height
    }
    let mainStart = point1;
    let mainEnd = point3;

    //根据不同角度，选取起始点和终止点
    if (gAngle >= 0 && gAngle < Math.PI / 2) {
        mainStart = point4;
        mainEnd = point2;
    } else if (gAngle >= Math.PI / 2 && gAngle < Math.PI) {
        mainStart = point1;
        mainEnd = point3;
    }
    let lengthStart = 0;
    let lengthEnd = 0;
    let startColor:any = {};
    let endColor:any = {};
    //计算向量距离
    const verticalDistance = (point1: Point, point2: Point, lineAngle:number):number => {
        return Math.abs(twoPointsDistance(point1.x, point1.y, point2.x, point2.y)) *
            Math.cos(twoPointsAngle(point1.x, point1.y, point2.x, point2.y) - lineAngle);
    }
    //起始点和起始坐标点之间的向量距离
    if (!(startPoint.x == mainStart.x && startPoint.y == mainStart.y)) {
        lengthStart = verticalDistance(mainStart, startPoint, gAngle);
    }
    //结束点和结束坐标点之间的向量距离
    if (!(endPoint.x == mainEnd.x && endPoint.y == mainEnd.y)) {
        lengthEnd = verticalDistance(endPoint, mainEnd, gAngle);
    }
    //渐变起始坐标处理(起始距离为正值和负值两种情况)
    if (lengthStart < 0) {
        for (let i = 1; i < stops.length; i++) {
            if (stops[i].position > -lengthStart / gDistance) {
                let currColor = stops[i].color;
                let preColor = stops[i - 1].color;
                const getVal = (prop) => {
                    return preColor[prop] + (currColor[prop] - preColor[prop]) / (stops[i].position - stops[i - 1].position) * (-lengthStart / gDistance - stops[i - 1].position)
                }
                startColor = {
                    index: i,
                    color: {
                        'alpha': getVal('alpha'),
                        'blue': getVal('blue'),
                        'green': getVal('green'),
                        'red': getVal('red')
                    },
                    position: -lengthStart / gDistance
                }
                break;
            }
        }
    } else {
        startColor = {
            index: 0,
            color: stops[0].color,
            position: -lengthStart / gDistance
        }
    }
    //渐变结束坐标处理(结束距离为正值和负值两种情况)
    if (lengthEnd < 0) {
        for (let i = 0; i < stops.length - 1; i++) {
            if (stops[i + 1].position > 1 + lengthEnd / gDistance) {
                let currColor = stops[i].color;
                let nextColor = stops[i + 1].color;
                const getVal = (prop) => {
                    return currColor[prop] + (nextColor[prop] - currColor[prop]) / (stops[i + 1].position - stops[i].position) * (1 + lengthEnd / gDistance - stops[i].position)
                }
                endColor = {
                    index: i,
                    color: {
                        'alpha': getVal('alpha'),
                        'blue': getVal('blue'),
                        'green': getVal('green'),
                        'red': getVal('red')
                    },
                    position: 1 + lengthEnd / gDistance
                }
                break;
            }
        }
    } else {
        endColor = {
            index: stops.length - 1,
            color: stops[stops.length - 1].color,
            position: 1 + lengthEnd / gDistance
        }
    }
    if (startColor.color) {
        changePointList.push(startColor);
    }
    for (let n = 0; n < stops.length; n++) {
        if (n >= startColor.index && n <= endColor.index) {
            changePointList.push(stops[n])
        }
    }
    if (endColor.color) {
        changePointList.push(endColor);
    }
    changePointList = changePointList.map(({
        color,
        position
    }) => {
        position = (position - changePointList[0].position) / (changePointList[changePointList.length - 1].position - changePointList[0].position)
        return {
            color,
            position
        }
    })
    const valList: GListItem[] = changePointList.map(({
        color,
        position
    }):GListItem => {
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
        };
        // return `rgba(${Math.round(red * 255)},${Math.round(green * 255)},${Math.round(blue * 255)},${Math.round(alpha * 100) / 100}) ${Math.round(position * 10000) / 100}%`;
    });

    return {
        gAngle: Math.round(gAngle / Math.PI * 180 * 10)/10,
        gList: valList,
    }
}
