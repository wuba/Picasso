import { uniqueId } from '../utils';
import { Layer } from '../types';

// import * as fs from 'fs';

//判断是否为列关系
function isSpan(item:Layer, beforeItem:Layer) {
    if (
        Array.isArray(item.children) &&
        Array.isArray(beforeItem.children) &&
        item.children.length == beforeItem.children.length &&
        item.children.length >= 2
    ) {
        let centreFlag = true;
        let itemClass = item.children[0].type != 'Text' ? 'notext' : 'text';
        let beforeItemClass = beforeItem.children[0].type != 'Text' ? 'notext' : 'text';
        if (itemClass == beforeItemClass) { // ?: 同为文案，或同时不是文案，不判定为列元素
            centreFlag = false;
        }
    
        for (let i = 0; i < item.children.length; i++) {
            const currItem = item.children[i];
            const currBeforeItem = beforeItem.children[i];
            let currClass = currItem.type != 'Text' ? 'notext' : 'text';
            if (currClass != itemClass) { // 与该行第一个元素相比较，不相同不判定为列
                centreFlag = false;
            }
            let beforeClass = currBeforeItem.type != 'Text' ? 'notext' : 'text';
            if (beforeClass != beforeItemClass) {
                centreFlag = false;
            }

            // 排除多段文案的情况
            if ((!currItem.id && currClass === 'text') || (!currBeforeItem.id && beforeClass === 'text')) {
                centreFlag = false;
            }

            if (
                Math.abs(
                    currItem.structure.x +
                    currItem.structure.width / 2 -
                    currBeforeItem.structure.x -
                    currBeforeItem.structure.width / 2
                ) > 2
            ) {
                centreFlag = false;
            }
        }

        return centreFlag;
    } else {
        return false;
    }
}
// 判断是否为文本列关系
function isTextSpan(item: Layer, beforeItem: Layer) {
    if (
        Array.isArray(item.children) &&
        Array.isArray(beforeItem.children) &&
        item.children.length == beforeItem.children.length &&
        item.children.length >= 2
    ) {
        let centreFlag = true;
        if (item.children[0].type !== 'Text'||beforeItem.children[0].type !== 'Text') {
            return false;
        }
        if (!item.children[0].style.textStyle.fontSize || !item.children[0].style.textStyle.fontWeight) {
            return false;
        }
        if (!beforeItem.children[0].style.textStyle.fontSize || !beforeItem.children[0].style.textStyle.fontWeight) {
            return false;
        }
        const getClass = (layer:Layer) => {
            return `${layer.style?.textStyle?.fontSize}_${layer.style?.textStyle?.fontWeight}`;
        }
        let itemClass = getClass(item.children[0]);
        let beforeItemClass = getClass(beforeItem.children[0]);
        if (itemClass === beforeItemClass) {
            centreFlag = false;
        }
        if ((!item.id && itemClass === 'text') || (!beforeItem.id && beforeItemClass === 'text')) {
            centreFlag = false;
        }
        for (let i = 0; i < item.children.length; i++) {
            const currItem = item.children[i];
            const currBeforeItem = beforeItem.children[i];
            let currClass = getClass(currItem);
            if (currClass != itemClass) {
                centreFlag = false;
            }
            let beforeClass = getClass(currBeforeItem);
            if (beforeClass != beforeItemClass) {
                centreFlag = false;
            }
            if (
                Math.abs( //不垂直居中
                    currItem.structure.x +
                    currItem.structure.width / 2 -
                    currBeforeItem.structure.x -
                    currBeforeItem.structure.width / 2
                ) > 2
                &&
                Math.abs( //不左对齐
                    currItem.structure.x - currBeforeItem.structure.x
                ) > 2
            ) {
                centreFlag = false;
            }
        }
        return centreFlag;
    } else {
        return false;
    }
}

export const handleSpanGroup = (data: Layer[]) => {
    if (!data) return data;
    if (data.length > 1) {
        let totalArr:Layer[][] = []; // 包含列关系和非列关系的所有layer数据
        let itemArr = [data[0]]; // 存储 没有列关系 或合并在一起的列关系 的数据
        for (let i = 1; i < data.length; i++) {
            const item = data[i];
            const beforeItem = data[i - 1];

            // 直接进入总layer数据列表totalArr: itemArr.length >= 2 或 (!isSpan && !isTextSpan)
            // 否则判定为列关系，将列关系数组加入到totalArr
            if (!(itemArr.length < 2 && (isSpan(item, beforeItem) || isTextSpan(item, beforeItem)))) {
                totalArr.push(itemArr);
                itemArr = []; // itemArr.length >= 2 时清空
            }
            itemArr.push(item); // 否则加入当前 item 的数据
        }
        totalArr.push(itemArr); 

        if (totalArr.length > 1) {
            let dataChildren = [];
            for (let j = 0; j < totalArr.length; j++) {
                const item = totalArr[j];
                if (item.length == 1) {
                    dataChildren.push(item[0]);
                } else if (item.length >= 2) {
                    let spanList: Layer = {};
                    //计算span的strutrue
                    let currDivX = 0,
                        currDivY = 0,
                        currMaxX = 0,
                        currMaxY = 0;
                    spanList.children = item;
                    for (let j = 0; j < spanList.children.length; j++) {
                        if (j == 0) {
                            currDivX = spanList.children[j].structure.x;
                            currDivY = spanList.children[j].structure.y;
                            currMaxX = spanList.children[j].structure.x + spanList.children[j].structure.width;
                            currMaxY = spanList.children[j].structure.y + spanList.children[j].structure.height;
                        } else {
                            if (currDivX > spanList.children[j].structure.x) {
                                currDivX = spanList.children[j].structure.x;
                            }
                            if (currDivY > spanList.children[j].structure.y) {
                                currDivY = spanList.children[j].structure.y;
                            }
                            if (
                                currMaxX <
                                spanList.children[j].structure.x + spanList.children[j].structure.width
                            ) {
                                currMaxX = spanList.children[j].structure.x + spanList.children[j].structure.width;
                            }
                            if (
                                currMaxY <
                                spanList.children[j].structure.y + spanList.children[j].structure.height
                            ) {
                                currMaxY = spanList.children[j].structure.y + spanList.children[j].structure.height;
                            }
                        }
                    }
                    let itemList:Layer[] = [];
                    for (let j = 0; j < item[0].children.length; j++) {
                        const oneItem = item[0].children[j];
                        const twoItem = item[1].children[j];
                        let currDivX = Math.min(oneItem.structure.x, twoItem.structure.x),
                            currDivY = Math.min(oneItem.structure.y, twoItem.structure.y),
                            currMaxX = Math.max(
                                oneItem.structure.x + oneItem.structure.width,
                                twoItem.structure.x + twoItem.structure.width
                            ),
                            currMaxY = Math.max(
                                oneItem.structure.y + oneItem.structure.height,
                                twoItem.structure.y + twoItem.structure.height
                            );
                        itemList.push({
                            id: uniqueId(),
                            name: 'ItemList',
                            class: 'Span',
                            type: 'Container',
                            structure: {
                                x: currDivX,
                                y: currDivY,
                                width: currMaxX - currDivX,
                                height: currMaxY - currDivY,
                            },
                            style: {},
                            children: [oneItem, twoItem]
                        });
                    }
                    dataChildren.push({
                        id: uniqueId(),
                        name: 'List',
                        class: 'Span',
                        type: 'Container',
                        structure: {
                            x: currDivX,
                            y: currDivY,
                            width: currMaxX - currDivX,
                            height: currMaxY - currDivY,
                        },
                        style: {},
                        children: itemList
                    });
                }
            }
            data = dataChildren;
        } else if (data.length == 2) {
            let itemList: Layer[] = [];
            for (let j = 0; j < data[0].children.length; j++) {
                const oneItem = data[0].children[j];
                const twoItem = data[1].children[j];
                let currDivX = Math.min(oneItem.structure.x, twoItem.structure.x),
                    currDivY = Math.min(oneItem.structure.y, twoItem.structure.y),
                    currMaxX = Math.max(
                        oneItem.structure.x + oneItem.structure.width,
                        twoItem.structure.x + twoItem.structure.width
                    ),
                    currMaxY = Math.max(
                        oneItem.structure.y + oneItem.structure.height,
                        twoItem.structure.y + twoItem.structure.height
                    );
                itemList.push({
                    id: uniqueId(),
                    name: 'ItemList',
                    class: 'Span',
                    type: 'Container',
                    structure: {
                        x: currDivX,
                        y: currDivY,
                        width: currMaxX - currDivX,
                        height: currMaxY - currDivY,
                    },
                    style: {},
                    children: [oneItem, twoItem]
                });
            }
            data = itemList;
        }
    }
    for (let i = 0; i < data.length; i++) {
        if (Array.isArray(data[i].children)) {
            data[i].children = handleSpanGroup(data[i].children);
        }
    }
    return data;
};
