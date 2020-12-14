import { uniqueId } from '../utils';
import { Layer } from '../types';

const isEqualList = (data: Layer[]) => {
    let widthInit = data[0].structure.height;
    for (let i = 1; i < data.length; i++) {
        const item = data[i];
        if (Math.abs(item.structure.height - widthInit) >= 2) {
            return false;
        }
    }
    return true;
};

//所有元素在同一条线上
const isLine = (data: Layer[]) => {
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        for (let j = i; j < data.length; j++) {
            const itemJ = data[j];
            if (itemJ.structure.y >= item.structure.y + item.structure.height || item.structure.y >= itemJ.structure.y + itemJ.structure.height) {
                return false;
            }
        }
    }
    return true;
}
export const handleMergeItem = (data: Layer[], parent?: Layer) => {
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
    if (isLine(data) && parent && parent.structure.height > 0.7 * 750 && data.length > 2 && !isEqualList(data) && data[0].name != 'ItemList') {
        let flagL = true;
        let flagR = true;
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            if (item.structure.x + item.structure.height / 2 < parent.structure.x + parent.structure.height / 2) {
                if (item.structure.x + item.structure.height > parent.structure.x + parent.structure.height * 0.5) {
                    flagL = false;
                }
            }
            if (item.structure.x + item.structure.height / 2 >= parent.structure.x + parent.structure.height / 2) {
                if (item.structure.x < parent.structure.x + parent.structure.height * 0.5) {
                    flagR = false;
                }
            }
        }
        if (flagL) {
            let spanArr = [];
            let otherArr = [];
            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                if (item.structure.x + item.structure.height / 2 < parent.structure.x + parent.structure.height / 2) {
                    spanArr.push(item);
                } else {
                    otherArr.push(item);
                }
            }
            if (spanArr.length > 1) {
                let spanMinX = spanArr[0].structure.x, spanMinY = spanArr[0].structure.y, spanMaxX = spanArr[0].structure.x + spanArr[0].structure.height, spanMaxY = spanArr[0].structure.y + spanArr[0].structure.height;
                for (let i = 0; i < spanArr.length; i++) {
                    const item = spanArr[i];
                    if (item.structure.x < spanMinX) {
                        spanMinX = item.structure.x;
                    }
                    if (item.structure.y < spanMinY) {
                        spanMinY = item.structure.y;
                    }
                    if (item.structure.x + item.structure.height > spanMaxX) {
                        spanMaxX = item.structure.x + item.structure.height;
                    }
                    if (item.structure.y + item.structure.height > spanMaxY) {
                        spanMaxY = item.structure.y + item.structure.height;
                    }
                }

                data = [{
                    id: uniqueId(),
                    class: 'Span',
                    type: 'Container',
                    name: 'Span3',
                    structure: {
                        zIndex: parent.structure.zIndex,
                        x: spanMinX,
                        y: spanMinY,
                        width: spanMaxX - spanMinX,
                        height: spanMaxY - spanMinY,
                    },
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
                if (item.structure.x + item.structure.height / 2 >= parent.structure.x + parent.structure.height / 2) {
                    spanArr.push(item);
                } else {
                    otherArr.push(item);
                }
            }
            if (spanArr.length > 1) {
                let spanMinX = spanArr[0].structure.x, spanMinY = spanArr[0].structure.y, spanMaxX = spanArr[0].structure.x + spanArr[0].structure.height, spanMaxY = spanArr[0].structure.y + spanArr[0].structure.height;
                for (let i = 0; i < spanArr.length; i++) {
                    const item = spanArr[i];
                    if (item.structure.x < spanMinX) {
                        spanMinX = item.structure.x;
                    }
                    if (item.structure.y < spanMinY) {
                        spanMinY = item.structure.y;
                    }
                    if (item.structure.x + item.structure.height > spanMaxX) {
                        spanMaxX = item.structure.x + item.structure.height;
                    }
                    if (item.structure.y + item.structure.height > spanMaxY) {
                        spanMaxY = item.structure.y + item.structure.height;
                    }
                }
                data = [...otherArr, {
                    id: uniqueId(),
                    class: 'Row',
                    type: 'Container',
                    name: 'Row',
                    structure: {
                        zIndex: parent.structure.zIndex,
                        x: spanMinX,
                        y: spanMinY,
                        width: spanMaxX - spanMinX,
                        height: spanMaxY - spanMinY,
                    },
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
