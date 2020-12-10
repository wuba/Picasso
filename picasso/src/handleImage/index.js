import isOval from './handleJudge/isOval';
import isRectangle from './handleJudge/isRectangle';
import isRegularShadow from './handleJudge/isRegularShadow';
import isRegularBorder from './handleJudge/isRegularBorder';
import isSupportedFill from './handleJudge/isSupportedFill';
/**
 * 计算不规则图形
 *
 * 如果一个组中存在不规则的 mask则 这个组将会做成一张切片
 *
 */
export default (layer) => {
    // 如果组上有阴影(内阴影或者外阴影)，则标记为导出的图形
    if (
        layer.type === 'Group'
        && layer.style?.shadows
        && [...layer.style.innerShadows, ...layer.style.shadows].find(item => item.enabled)
    ) {
        return true;
    }

    // 如果图层是图片，则导出为图片
    if (layer.type === 'Image') {
        return true;
    }

    // 不支持的填充，导出为图片
    if (!isSupportedFill(layer)) {
        return true;
    }

    // 不规则边框则导出当前图层
    if (!isRegularBorder(layer)) {
        return true;
    }

    // 不规则图形、矢量图形 则将整个组导出为图片
    if (['Star', 'Triangle', 'ShapeGroup', 'Polygon'].includes(layer.shapeType)) {
        return true;
    }

    // TBD Line&Array
    if (layer.type === 'ShapePath' && layer.shapeType === 'Custom' && Array.isArray(layer.points)) {
        for (let i = 0; i < layer.points.length; i++) {
            const { pointType } = layer.points[i];

            // 非直点属于不规则矩形
            if (pointType !== 'Straight') {
                return true;
            }
        }
    }

    // 模糊效果直接导出
    if (layer.style?.blur?.enabled) {
        return true;
    }

    // 有矢量点的时候
    if (layer.style && layer.points) {
        // 排除 Mask 的情况
        if (layer.shapeType === 'Oval') {
            return !isOval(layer);
        }

        if (layer.shapeType === 'Rectangle') {
            return !isRectangle(layer);
        }
    }

    // 文本
    if (layer.type === 'Text' && layer.style?.borders) {
        // 如果文本有可用的border也导出图片
        return layer.style?.borders?.find(border => border.enabled);
    }

    // 不规则阴影，导出为图片
    if (!isRegularShadow(layer)) {
        return true;
    }

    return false;
};
