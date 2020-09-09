const { uniqueId } = require('../../../../common/utils');

const isEqualList = (data) => {
    let widthInit = data[0].width;
    for (let i = 1; i < data.length; i++) {
        const item = data[i];
        if (Math.abs(item.width - widthInit) >= 2) {
            return false;
        }
    }
    return true;
};

//所有元素在同一条线上
const isLine = (data) => {
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        for (let j = i; j < data.length; j++) {
            const itemJ = data[j];
            if (itemJ.y >= item.y + item.height || item.y >= itemJ.y + itemJ.height) {
                return false;
            }
        }
    }
    return true;
}
const handleMergeItem = (data, parent = '') => {
    if (!data) {
        return data;
    }
    /**
     * 1.父元素宽度接近画板
     * 2.子元素呈现出明显的聚合
     * 
     * 左聚合：当中心在左边时且全部元素在左边
     * 右聚合：当中心在右边时且全部元素在右边
     */
    if (isLine(data, parent) && parent && parent.width > 0.7 * 750 && data.length > 2 && !isEqualList(data) && data[0].name != 'ItemList') {
        let flagL = true;
        let flagR = true;
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            if (item.x + item.width / 2 < parent.x + parent.width / 2) {
                if (item.x + item.width > parent.x + parent.width * 0.5) {
                    flagL = false;
                }
            }
            if (item.x + item.width / 2 >= parent.x + parent.width / 2) {
                if (item.x < parent.x + parent.width * 0.5) {
                    flagR = false;
                }
            }
        }
        if (flagL) {
            let spanArr = [];
            let otherArr = [];
            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                if (item.x + item.width / 2 < parent.x + parent.width / 2) {
                    spanArr.push(item);
                } else {
                    otherArr.push(item);
                }
            }
            if (spanArr.length > 1) {
                let spanMinX = spanArr[0].x, spanMinY = spanArr[0].y, spanMaxX = spanArr[0].x + spanArr[0].width, spanMaxY = spanArr[0].y + spanArr[0].height;
                for (let i = 0; i < spanArr.length; i++) {
                    const item = spanArr[i];
                    if (item.x < spanMinX) {
                        spanMinX = item.x;
                    }
                    if (item.y < spanMinY) {
                        spanMinY = item.y;
                    }
                    if (item.x + item.width > spanMaxX) {
                        spanMaxX = item.x + item.width;
                    }
                    if (item.y + item.height > spanMaxY) {
                        spanMaxY = item.y + item.height;
                    }
                }

                data = [{
                    index: parent.index,
                    id: uniqueId(),
                    class: "Span",
                    type: 'Container',
                    name: 'Span3',
                    x: spanMinX,
                    y: spanMinY,
                    width: spanMaxX - spanMinX,
                    height: spanMaxY - spanMinY,
                    children: spanArr,
                    style: {}
                }, ...otherArr];
            }
        }
        if (flagR) {
            let spanArr = [];
            let otherArr = [];
            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                if (item.x + item.width / 2 >= parent.x + parent.width / 2) {
                    spanArr.push(item);
                } else {
                    otherArr.push(item);
                }
            }
            if (spanArr.length > 1) {
                let spanMinX = spanArr[0].x, spanMinY = spanArr[0].y, spanMaxX = spanArr[0].x + spanArr[0].width, spanMaxY = spanArr[0].y + spanArr[0].height;
                for (let i = 0; i < spanArr.length; i++) {
                    const item = spanArr[i];
                    if (item.x < spanMinX) {
                        spanMinX = item.x;
                    }
                    if (item.y < spanMinY) {
                        spanMinY = item.y;
                    }
                    if (item.x + item.width > spanMaxX) {
                        spanMaxX = item.x + item.width;
                    }
                    if (item.y + item.height > spanMaxY) {
                        spanMaxY = item.y + item.height;
                    }
                }
                data = [...otherArr, {
                    index: parent.index,
                    id: uniqueId(),
                    class: "Row",
                    type: 'Container',
                    name: 'Row',
                    x: spanMinX,
                    y: spanMinY,
                    width: spanMaxX - spanMinX,
                    height: spanMaxY - spanMinY,
                    children: spanArr,
                    style: {}
                }];
            }

        }
    }
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (Array.isArray(item.children)) {
            item.children = handleMergeItem(item.children, item);
        }
    }
    return data;
}
module.exports = handleMergeItem;
