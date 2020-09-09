const twoPointsDistance = require('./twoPointsDistance');

module.exports = (gradient, layer, fillStyle, contextSettings = 1) => {
    let style = {};
    let frame = layer.frame;
    let startPointStr = gradient.from;
    let startX = +startPointStr.split('{')[1].split(',')[0] * frame.width;
    let startY = -startPointStr.split(',')[1].split('}')[0] * frame.height;
    let endPointStr = gradient.to;
    let endX = +endPointStr.split('{')[1].split(',')[0] * frame.width;
    let endY = -endPointStr.split(',')[1].split('}')[0] * frame.height;
    let r = Math.abs(twoPointsDistance(startX, startY, endX, endY));
    let stops = gradient.stops;
    let valList = stops.map(({
        color,
        position
    }) => {
        let {
            red,
            green,
            blue,
            alpha
        } = color;
        if (layer.style.contextSettings) {
            alpha = layer.style.contextSettings.opacity * contextSettings * alpha;
        }
        return `rgba(${Math.round(red * 255)},${Math.round(green * 255)},${Math.round(blue * 255)},${Math.round(alpha * 100) / 100}) ${Math.round(position * 10000) / 100}%`;
    });
    if (fillStyle.gradient.elipseLength > 0) { //椭圆渐变
        let elipseLength = fillStyle.gradient.elipseLength;
        if (Math.abs(endY - startY) < 1) { //可解析
            let r2 = elipseLength * r;
            style['background'] = `radial-gradient( ${r}px ${r2}px at ${startX}px ${-startY}px,${valList.join(',')})`;
        } else if (Math.abs(endX - startX) < 1) {
            let r2 = elipseLength * r;
            style['background'] = `radial-gradient( ${r2}px ${r}px at ${startX}px ${-startY}px,${valList.join(',')})`;
            //导出图层
        } else {
            //如果倾斜则 导出该图层
        }
        //否则解析
    } else { //圆形渐变
        style['background'] = `radial-gradient( ${r}px ${r}px at ${startX}px ${-startY}px,${valList.join(',')})`;
    }
    return style;
}
