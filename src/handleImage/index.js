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
const judge = (layer) => {
    // 纯矢量原子组（图标类）整组导出为一张图片，避免 SVG 导入结构被拆成碎片图
    if (isAtomicVectorGroup(layer)) {
        return true;
    }

    // 如果组上有阴影(内阴影或者外阴影)，则标记为导出的图形
    if (
        layer.type === 'Group'
        && layer.style?.shadows
        && [...layer.style.innerShadows, ...layer.style.shadows].find(item => item.enabled)
    ) {
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

    // 图片、矢量 则直接导出为图片
    if (['Image','Shape'].includes(layer.type)) {
        return true;
    }

    // 不规则图形、矢量图形 则将整个组导出为图片
    if (['Star', 'Triangle', 'ShapeGroup', 'Polygon'].includes(layer.shapeType)) {
        return true;
    }

    // Line&Array 线和箭头
    if (layer.type === 'ShapePath' && layer.shapeType === 'Custom' && Array.isArray(layer.points)) {
        // 大于4个点的，导出为图片
        if (layer.points.length>4) {
            return true;
        }
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

/**
 * 纯矢量原子组判定（图标 / 插画类）
 *
 * 组内（递归）只包含矢量图形与组——不含文本、位图、组件实例等，
 * 且至少存在一个按叶子级判定本来就要退化为图片的图形（不规则 Path、ShapeGroup 等）。
 * 此时把栅格化从叶子提升到组级：整组导出一张图，而不是拆成一堆碎片小图。
 *
 * 天然排除：含文本/位图的业务卡片（非纯矢量）、纯规则矩形的装饰组（无退化叶子，
 * 继续按矢量节点解析）。
 */
export const isAtomicVectorGroup = (group) => {
    if (group.type !== 'Group') {
        return false;
    }

    let hasImageLeaf = false;

    const isPureVector = (layer) => {
        const children = layer.layers || [];

        for (let i = 0; i < children.length; i++) {
            const child = children[i];

            if (child.hidden || child.type === 'Slice' || child.type === 'HotSpot') {
                continue;
            }

            if (child.type === 'Group') {
                if (!isPureVector(child)) {
                    return false;
                }
            } else if (child.type === 'Shape' || child.type === 'ShapePath') {
                if (judge(child)) {
                    hasImageLeaf = true;
                }
            } else {
                // Text / Image / SymbolInstance 等：不是纯矢量组
                return false;
            }
        }

        return true;
    };

    return isPureVector(group) && hasImageLeaf;
};

export default judge;
