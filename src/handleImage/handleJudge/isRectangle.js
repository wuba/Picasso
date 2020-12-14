import isRect from './isRect';
// 判断是否是正规的矩形
const isRectangle = (layer) => {
    const { points } = layer;

    if (layer.points && layer.points.length != 4) {
        return false;
    }

    for (let i = 0; i < points.length; i++) {
        const { pointType } = points[i];

        // 非直点属于不规则矩形
        if (pointType !== 'Straight') {
            return false;
        }
    }

    return isRect(points);
};

export default isRectangle;
