// 判断是否是正圆
const isOval = (layer) => {
    const { points } = layer;

    if (layer.points && layer.points.length !== 4) {
        return false;
    }

    for (let i = 0; i < points.length; i++) {
        const { pointType, curveFrom, curveTo, point } = points[i];

        // 非镜像属于不规则圆形
        if (pointType !== 'Mirrored') {
            return false;
        }

        if (i == 0 || i == 2) {
            if (curveFrom.y !== curveTo.y || curveTo.y !== point.y) {
                return false;
            }
        } else if (i == 1 || i == 3) {
            if (curveFrom.x !== curveTo.x || curveTo.x !== point.x) {
                return false;
            }
        }
    }

    // 判断是否是正圆
    if (Math.abs(layer.frame.width - layer.frame.height) >= 0.1) { // 表示是一个椭圆
        return false;
    }

    return true;
};

export default isOval;
