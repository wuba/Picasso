// 判断阴影
const isRegularShadow = (layer) => {
    if (layer.style && layer.style.shadows) {
        // 查找所有可用的阴影
        let shadowList = [];
        layer.style.shadows.map(item => {
            if (item.isEnabled) {
                shadowList.push(item);
            }
        })

        let notRegularShadow = shadowList.find(item => {
            if (item.contextSettings && item.contextSettings.blendMode != 0) { // blendMode != 0 表示不规则的阴影
                return true;
            }
        })

        if (notRegularShadow) {
            return false;

        }
    }

    if (layer.style && layer.style.innerShadows) {
        if (layer._class == 'text') { // 文本具有外阴影则导出图片
            let shadowList = [];
            layer.style.innerShadows.map(item => {
                if (item.isEnabled) {
                    shadowList.push(item)
                }
            })
            return shadowList.length > 0 ? false : true;
        } else {
            // 查找所有可用的阴影
            let shadowList = [];
            layer.style.innerShadows.map(item => {
                if (item.isEnabled) {
                    shadowList.push(item)
                }
            })

            let notRegularShadow = shadowList.find(item => {
                if (item.contextSettings && item.contextSettings.blendMode != 0) { // blendMode != 0 表示不规则的阴影
                    return true;
                }
            })

            if (notRegularShadow) {
                return false;
            }
        }
    }

    return true;
}

module.exports = isRegularShadow;