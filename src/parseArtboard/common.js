import sketch from 'sketch';

// 路径处理, 如果不处理中文路径会报错
export const handleFilePath = filePath => NSURL.URLWithString(
    String(
        NSString.stringWithString(filePath).stringByExpandingTildeInPath(),
    ).replace(/ /g, '%20'),
);

/**
 * 判断是否为某个sketch类型
 * @param {*} layer
 * @param {*} theClass
 */
export const isTheClass = (layer, theClass) => {
    if (!layer) return false;
    const klass = layer.class();

    return klass === theClass;
};

export const toJSString = str => str.toString();

/**
 * 删除某个图层
 * @param {*} layer
 */
export const removeLayer = (layer) => {
    const container = layer.parentGroup();

    if (container) container.removeLayer(layer);
};

/**
 * 查找图层
 * @param {*} format 
 * @param {*} container 
 * @param {*} returnArray 
 */
export const find = (format, container, returnArray) => {
    if (!format || !format.key || !format.match) {
        return false;
    }

    const predicate = NSPredicate.predicateWithFormat(format.key, format.match);
    let items;

    if (container.pages) {
        items = container.pages();
    } else if (isTheClass(container, MSSharedStyleContainer) || isTheClass(container, MSSharedTextStyleContainer)) {
        items = container.objectsSortedByName();
    } else if (container.children) {
        items = container.children();
    } else {
        items = container;
    }

    const queryResult = items.filteredArrayUsingPredicate(predicate);

    if (returnArray) return queryResult;

    if (queryResult.count() == 1) {
        return queryResult[0];
    }

    if (queryResult.count() > 0) {
        return queryResult;
    }

    return false;
};

/**
 * 导出图片
 */
export const exportImage = (layer, sliceSize, rootPath, trimmed = true, groupContentsOnly = true) => {
    let scale = 1;

    // 根据选择尺寸导出最大的满足需求的图片尺寸
    if ([1, 1.5, 2, 3, 4].includes(+sliceSize)) {
        scale = Math.floor(4 / sliceSize);
    }

    const option = {
        scales: scale,
        formats: 'png',
        trimmed, // 剪切图片透明无效区域
        'use-id-for-name': true,
        'group-contents-only': groupContentsOnly,
        'save-for-web': true,
        output: rootPath + '/imgs',
    };

    try {
        sketch.export(layer, option);
        return `${layer.id}${+scale===1?'':`@${scale}x`}.png`;
    } catch (err) {
        // console.log('图片导出失败,图层信息：', layer.id, layer.type, err, layer.name);
        return '';
    }
};
