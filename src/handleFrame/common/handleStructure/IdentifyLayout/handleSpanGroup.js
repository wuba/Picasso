const { uniqueId } = require('../../../../common/utils');

//判断是否为列关系
function isSpan(item, beforeItem) {
    if (
        Array.isArray(item.children) &&
        Array.isArray(beforeItem.children) &&
        item.children.length == beforeItem.children.length &&
        item.children.length >= 2
    ) {
        let centreFlag = true;
        let itemClass = item.children[0].type != "Text" ? "notext" : "text";
        let beforeItemClass =
            beforeItem.children[0].type != "Text" ? "notext" : "text";
        if (itemClass == beforeItemClass) {
            centreFlag = false;
        }
        for (let i = 0; i < item.children.length; i++) {
            const currItem = item.children[i];
            const currBeforeItem = beforeItem.children[i];
            let currClass = currItem.type != "Text" ? "notext" : "text";
            if (currClass != itemClass) {
                centreFlag = false;
            }
            let beforeClass = currBeforeItem.type != "Text" ? "notext" : "text";
            if (beforeClass != beforeItemClass) {
                centreFlag = false;
            }
            if (
                Math.abs(
                    currItem.x +
                    currItem.width / 2 -
                    currBeforeItem.x -
                    currBeforeItem.width / 2
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
//判断是否为文本列关系
function isTextSpan(item, beforeItem) {
    if (
        Array.isArray(item.children) &&
        Array.isArray(beforeItem.children) &&
        item.children.length == beforeItem.children.length &&
        item.children.length >= 2
    ) {
        let centreFlag = true;
        if (item.children[0].type != "Text") {
            return false;
        }
        if (beforeItem.children[0].type != "Text") {
            return false;
        }
        if (!item.children[0].style['font-size'] || !item.children[0].style['font-weight']) {
            return false;
        }
        if (!beforeItem.children[0].style['font-size'] || !beforeItem.children[0].style['font-weight']) {
            return false;
        }
        const getClass = (layer) => {
            return `${layer.style['font-size']}_${layer.style['font-weight']}`;
        }
        let itemClass = getClass(item.children[0]);
        let beforeItemClass = getClass(beforeItem.children[0]);
        if (itemClass == beforeItemClass) {
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
                    currItem.x +
                    currItem.width / 2 -
                    currBeforeItem.x -
                    currBeforeItem.width / 2
                ) > 2
                &&
                Math.abs( //不左对齐
                    currItem.x - currBeforeItem.x
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
/**
 *
 *
 *
 *
 *
 *
 */
const handleListGroup = data => {
    if (!data) return data;
    if (data.length > 1) {
        let totalArr = [];
        let itemArr = [data[0]];
        for (let i = 1; i < data.length; i++) {
            const item = data[i];
            const beforeItem = data[i - 1];
            if (!(itemArr.length < 2 && (isSpan(item, beforeItem) || isTextSpan(item, beforeItem)))) {
                totalArr.push(itemArr);
                itemArr = [];
            }
            itemArr.push(item);
        }
        totalArr.push(itemArr);
        if (totalArr.length > 1) {
            let dataChildren = [];
            for (let j = 0; j < totalArr.length; j++) {
                const item = totalArr[j];
                if (item.length == 1) {
                    dataChildren.push(item[0]);
                } else if (item.length >= 2) {
                    let spanList = {};
                    //计算span的strutrue
                    let currDivX = 0,
                        currDivY = 0,
                        currMaxX = 0,
                        currMaxY = 0;
                    spanList.children = item;
                    for (let j = 0; j < spanList.children.length; j++) {
                        if (j == 0) {
                            currDivX = spanList.children[j].x;
                            currDivY = spanList.children[j].y;
                            currMaxX = spanList.children[j].x + spanList.children[j].width;
                            currMaxY = spanList.children[j].y + spanList.children[j].height;
                        } else {
                            if (currDivX > spanList.children[j].x) {
                                currDivX = spanList.children[j].x;
                            }
                            if (currDivY > spanList.children[j].y) {
                                currDivY = spanList.children[j].y;
                            }
                            if (
                                currMaxX <
                                spanList.children[j].x + spanList.children[j].width
                            ) {
                                currMaxX = spanList.children[j].x + spanList.children[j].width;
                            }
                            if (
                                currMaxY <
                                spanList.children[j].y + spanList.children[j].height
                            ) {
                                currMaxY = spanList.children[j].y + spanList.children[j].height;
                            }
                        }
                    }
                    let itemList = [];
                    for (let j = 0; j < item[0].children.length; j++) {
                        const oneItem = item[0].children[j];
                        const twoItem = item[1].children[j];
                        let currDivX = Math.min(oneItem.x, twoItem.x),
                            currDivY = Math.min(oneItem.y, twoItem.y),
                            currMaxX = Math.max(
                                oneItem.x + oneItem.width,
                                twoItem.x + twoItem.width
                            ),
                            currMaxY = Math.max(
                                oneItem.y + oneItem.height,
                                twoItem.y + twoItem.height
                            );
                        itemList.push({
                            id: uniqueId(),
                            name: "ItemList",
                            class: "Span",
                            type: "Container",
                            x: currDivX,
                            y: currDivY,
                            width: currMaxX - currDivX,
                            height: currMaxY - currDivY,
                            style: {},
                            children: [oneItem, twoItem]
                        });
                    }
                    dataChildren.push({
                        id: uniqueId(),
                        name: "List",
                        class: "Span",
                        type: "Container",
                        x: currDivX,
                        y: currDivY,
                        width: currMaxX - currDivX,
                        height: currMaxY - currDivY,
                        style: {},
                        children: itemList
                    });
                }
            }
            data = dataChildren;
        } else if (data.length == 2) {
            let itemList = [];
            for (let j = 0; j < data[0].children.length; j++) {
                const oneItem = data[0].children[j];
                const twoItem = data[1].children[j];
                let currDivX = Math.min(oneItem.x, twoItem.x),
                    currDivY = Math.min(oneItem.y, twoItem.y),
                    currMaxX = Math.max(
                        oneItem.x + oneItem.width,
                        twoItem.x + twoItem.width
                    ),
                    currMaxY = Math.max(
                        oneItem.y + oneItem.height,
                        twoItem.y + twoItem.height
                    );
                itemList.push({
                    id: uniqueId(),
                    name: "ItemList",
                    class: "Span",
                    type: "Container",
                    x: currDivX,
                    y: currDivY,
                    width: currMaxX - currDivX,
                    height: currMaxY - currDivY,
                    style: {},
                    children: [oneItem, twoItem]
                });
            }
            data = itemList;
        }
    }
    for (let i = 0; i < data.length; i++) {
        if (Array.isArray(data[i].children)) {
            data[i].children = handleListGroup(data[i].children);
        }
    }
    return data;
};
// if (typeof module !== 'undefined') {
module.exports = handleListGroup;
// }
