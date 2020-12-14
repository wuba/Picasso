/**
 * 判断是否为规则阴影
 * @param {*} layer
 */
const isRegularShadow = (layer) => {
    const shadowList = [];

    if (layer.style && layer.style.shadows) {
        // 查找所有可用的阴影
        layer.style.shadows.map((item) => {
            if (item.enabled) {
                shadowList.push(item);
            }
        });
    }

    if (layer.style && layer.style.innerShadows) {
        layer.style.innerShadows.map((item) => {
            if (item.enabled) {
                shadowList.push(item);
            }
        });
    }

    if (layer.type === 'Text') { // 文本具有阴影则导出图片
        return shadowList.length === 0;
    }

    return true;
};

export default isRegularShadow;
