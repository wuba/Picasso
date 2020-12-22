

import {
    CLASS_TYPE
} from './const';

import { DSL,Layer } from './types';
import { uniqueId } from './utils';

const handleSpan = (data:Layer[]) => {
    let positionList = [];
    let noPostionList = [];
    data.forEach((item) => {
        if (item.isPosition) {
            positionList.push(item);
        } else {
            noPostionList.push(item);
        }
    });
    data = noPostionList;
    //让宽度最大的元素放在最前面
    data = data.sort((a, b) => b.structure.width - a.structure.width);
    //处理进行分列
    //同列的元素外面加一个Span容器
    // 结构调整data
    //children本身全部在一行的不需要加Span容器
    let assignSpanList:DSL[] = [];
    for (let i = 0; i < data.length; i++) {
        let flag = true;
        for (let j = 0; j < assignSpanList.length; j++) {
            //属于哪个容器就放到哪个容器中
            for (let n = 0; n < assignSpanList[j].length; n++) {
                if (flag && ((assignSpanList[j][n].structure.x <= data[i].structure.x && data[i].structure.x < (+assignSpanList[j][n].structure.x + assignSpanList[j][n].structure.width)) ||
                    (+assignSpanList[j][n].structure.x < +data[i].structure.x + data[i].structure.width && +data[i].structure.x + data[i].structure.width <= (+assignSpanList[j][n].structure.x + assignSpanList[j][n].structure.width)))) {
                    assignSpanList[j].push(data[i]);
                    flag = false;
                }
            }
        }
        //都不属于则新建容器，放入其中
        if (flag) {
            assignSpanList.push([data[i]]);
        }
    }
    //children本身全部在一列的不需要加Span容器
    if (data.length == assignSpanList[0].length) {
        assignSpanList = assignSpanList[0].map(item => [item]);
    }
    /**
     * 分列完成后，给属于同一列的加容器
     * 同时给容器赋值x,y,width,height
     * 获取结构调整后的data
     */
    let spanList: Layer[] = [];
    for (let i = 0; i < assignSpanList.length; i++) {
        if (assignSpanList[i].length == 1) {
            spanList.push(assignSpanList[i][0]);
        } else {
            let currSpan = [],
                currDivX = 0,
                currDivY = 0,
                currMaxX = 0,
                currMaxY = 0,
                zIndex = 0;
            currSpan = assignSpanList[i].sort((a, b) => a.structure.y - b.structure.y);
            // currSpan = assignSpanList[i];
            zIndex = currSpan[0].structure.zIndex;
            for (let j = 0; j < currSpan.length; j++) {
                zIndex = currSpan[j].structure.zIndex > zIndex ? currSpan[j].structure.zIndex : zIndex;
                if (j == 0) {
                    currDivX = currSpan[j].structure.x;
                    currDivY = currSpan[j].structure.y;
                    currMaxX = currSpan[j].structure.x + currSpan[j].structure.width;
                    currMaxY = currSpan[j].structure.y + currSpan[j].structure.height;
                } else {
                    if (currDivX > currSpan[j].structure.x) {
                        currDivX = currSpan[j].structure.x
                    }
                    if (currDivY > currSpan[j].structure.y) {
                        currDivY = currSpan[j].structure.y
                    }
                    if (currMaxX < currSpan[j].structure.x + currSpan[j].structure.width) {
                        currMaxX = currSpan[j].structure.x + currSpan[j].structure.width;
                    }
                    if (currMaxY < currSpan[j].structure.y + currSpan[j].structure.height) {
                        currMaxY = currSpan[j].structure.y + currSpan[j].structure.height;
                    }
                }
            }
            spanList.push({
                id: uniqueId(),
                name: 'Span1',
                class: 'Span',
                type: 'Container',
                structure: {
                    zIndex,
                    x: currDivX,
                    y: currDivY,
                    width: currMaxX - currDivX,
                    height: currMaxY - currDivY,
                },
                children: currSpan,
                style: {}
            });
        }
    }
    data = spanList.sort((a, b) => a.structure.x - b.structure.x);
    data = [...data, ...positionList];
    return data;
}

//分行处理
//判断是否为同一行
//同一行给予DIV包裹并且将该行元素作为DIV的子元素
function isSame(data:Layer[]) {
    let flag = true;
    if (Array.isArray(data) && data.length > 2) {
        let firstItemWidth = data[0].structure.width;
        let firstItemHeight = data[0].structure.height;
        data.forEach((item) => {
            if (Math.abs(firstItemWidth - item.structure.width) > 1 || Math.abs(firstItemHeight - item.structure.height) > 1) {
                flag = false;
            }
        })
    }
    return flag;
}

//判断属于左边的图片
const isLeftImg = (layer:Layer, parent?:Layer) => {
    //必须为图片类型
    if (layer.type !== 'Image') {
        return false;
    }
    //距离画板左边的距离<100
    if (layer.structure.x > 100) {
        return false;
    }
    //距离画板左边的距离<100
    if (layer.structure.width < 40) {
        return false;
    }
    //父元素必须存在
    if (!parent) {
        return false;
    }
    //容器的宽度>750*0.7
    if (parent.structure.width < 750 * 0.7) {
        return false;
    }
    for (let i = 1; i < parent.children.length; i++) {
        const item = parent.children[i];
        if (item.structure.x < layer.structure.x + layer.structure.width) {
            return false;
        }
    }
    return true;
}

const isLeftImgRightInfo = (item:Layer) => {
    if (Array.isArray(item.children) && item.children.length > 3 && isLeftImg(item.children[0], item)) {
        let itemChildren: Layer[] = [...item.children];
        let firstChildren = itemChildren.shift();
        let currSpan = itemChildren;
        let flag = false;
        for (let j = 0; j < currSpan.length; j++) {
            let item = currSpan[j];
            for (let i = j; i < currSpan.length; i++) {
                const itemI = currSpan[i];
                if (
                    (
                        (itemI.structure.x + itemI.structure.width > item.structure.x && item.structure.x >= itemI.structure.x) ||
                        (item.structure.x + item.structure.width > itemI.structure.x && itemI.structure.x >= item.structure.x)
                    ) && (
                        item.structure.y + item.structure.height <= itemI.structure.y ||
                        itemI.structure.y + itemI.structure.height <= item.structure.y
                    )
                ) {
                    flag = true;
                }
            }
        }
        if (flag) {
            let currDivX, currDivY, currMaxX, currMaxY;
            let zIndex = currSpan[0].structure.zIndex;
            for (let j = 0; j < currSpan.length; j++) {
                zIndex = currSpan[j].structure.zIndex > zIndex ? currSpan[j].structure.zIndex : zIndex;
                if (j == 0) {
                    currDivX = currSpan[j].structure.x;
                    currDivY = currSpan[j].structure.y;
                    currMaxX = currSpan[j].structure.x + currSpan[j].structure.width;
                    currMaxY = currSpan[j].structure.y + currSpan[j].structure.height;
                } else {
                    if (currDivX > currSpan[j].structure.x) {
                        currDivX = currSpan[j].structure.x
                    }
                    if (currDivY > currSpan[j].structure.y) {
                        currDivY = currSpan[j].structure.y
                    }
                    if (currMaxX < currSpan[j].structure.x + currSpan[j].structure.width) {
                        currMaxX = currSpan[j].structure.x + currSpan[j].structure.width;
                    }
                    if (currMaxY < currSpan[j].structure.y + currSpan[j].structure.height) {
                        currMaxY = currSpan[j].structure.y + currSpan[j].structure.height;
                    }
                }
            }
            item.name = 'LeftImgRightInfo';
            firstChildren.class_name = 'left';
            firstChildren.class_type = CLASS_TYPE.RELY_ON_PARENT;
            item.children = [firstChildren, {
                id: uniqueId(),
                name: 'Span2',
                class: 'Span',
                type: 'Container',
                structure: {
                    zIndex,
                    x: currDivX,
                    y: currDivY,
                    width: currMaxX - currDivX,
                    height: currMaxY - currDivY,
                },
                children: currSpan,
                style: {},
                class_name: 'right',
                class_type: CLASS_TYPE.RELY_ON_PARENT,
            }];

        } else {
            item.children = handleSpan(item.children);
        }
        return item;
    } else {
        item.children = handleSpan(item.children);
    }
    return item;
}

//上下合并
const handleMerge = (data:Layer[]) => {
    let leftRItem:Layer = {};
    let flag = false;
    for (let i = 0; i < data.length; i++) {
        if (flag) {
            let secondChild = leftRItem.children[1];
            if (data[i].structure.x > secondChild.structure.x - 2) {
                secondChild.children.push({ ...data[i] });
                secondChild.structure.height = data[i].structure.y + data[i].structure.height - secondChild.structure.y;
                leftRItem.structure.height = data[i].structure.y + data[i].structure.height - leftRItem.structure.y;
                if (secondChild.structure.width + secondChild.structure.x < data[i].structure.x + data[i].structure.width) {
                    secondChild.structure.width = data[i].structure.x + data[i].structure.width - secondChild.structure.x;
                }
                leftRItem.structure.width = secondChild.structure.width + secondChild.structure.x - leftRItem.structure.x;
                data[i].delete = true;
            } else {
                flag = false;
            }
        }
        if (data[i].name == 'LeftImgRightInfo') {
            flag = true;
            leftRItem = data[i];
        }
    }
    return data.filter(item => !item.delete);
}

const handleRow = (data:Layer[], parent?:Layer) => {
    if (parent && parent.textContainer) {
        return data;
    }
    if (isSame(data)) {
        //递归处理children
        for (let i = 0; i < data.length; i++) {
            if (Array.isArray(data[i].children) && data[i].children.length > 0) {
                data[i].children = handleRow(data[i].children, data[i]);
            }
        }
        return data;
    }
    //让高度最大的元素放在最前面
    data = data.sort((a, b) => b.structure.height - a.structure.height);
    //处理进行分行
    //同行的元素外面加一个Row容器
    // 结构调整data
    //children本身全部在一行的不需要加Row容器
    //let assignRowList = [];
    // let rowArr = [];
    // for (let i = 0; i < data.length; i++) {
    //     let flag = true;
    //     if (rowArr.length > 0) {
    //         flag = false;
    //         for (let j = 0; j < rowArr.length; j++) {
    //             const item = rowArr[j];
    //             if (data[i].structure.y + data[i].structure.height > item.structure.y && item.structure.y + item.structure.height > data[i].structure.y) {
    //                 flag = true;
    //             }
    //         }
    //         if (!flag) {
    //             assignRowList.push(rowArr);
    //             rowArr = [];
    //         }
    //     }
    //     rowArr.push(data[i]);
    // }
    // if (rowArr.length > 0) {
    //     if (rowArr.length == data.length) {
    //         //等待华哥算法更新后 过滤掉其中已经处理的部分
    //         if (parent && parent.type != '__li') {
    //             data = handleSpan(data);
    //         }
    //         for (let i = 0; i < data.length; i++) {
    //             if (Array.isArray(data[i].children) && data[i].children.length > 0) {
    //                 data[i].children = handleRow(data[i].children, data[i]);
    //             }
    //         }
    //         return data;
    //     } else {
    //         assignRowList.push(rowArr);
    //     }
    // }
    let assignRowList = [];
    for (let i = 0; i < data.length; i++) {
        let flag = true;
        for (let j = 0; j < assignRowList.length; j++) {
            //属于哪个容器就放到哪个容器中
            for (let n = 0; n < assignRowList[j].length; n++) {
                if (flag && ((assignRowList[j][n].structure.y <= data[i].structure.y && data[i].structure.y < (+assignRowList[j][n].structure.y + assignRowList[j][n].structure.height)) ||
                    (+assignRowList[j][n].structure.y < +data[i].structure.y + data[i].structure.height && +data[i].structure.y + data[i].structure.height <= (+assignRowList[j][n].structure.y + assignRowList[j][n].structure.height)))) {
                    assignRowList[j].push(data[i]);
                    flag = false;
                }
            }
        }
        //都不属于则新建容器，放入其中
        if (flag) {
            assignRowList.push([data[i]]);
        }
    }
    /**
     * 分行完成后，给属于同一行的加容器
     * 同时给容器赋值x,y,width,height
     * 获取结构调整后的data
     */
    let rowList = [];
    //children本身全部在一行的不需要加Row容器
    if (assignRowList.length && data.length == assignRowList[0].length) {
        if (parent && parent.sign != '__li') {
            rowList = handleSpan(assignRowList[0]);
        } else {
            rowList = assignRowList[0];
        }

        if (parent) {
            parent.class = 'Row';
        }
    } else {
        for (let i = 0; i < assignRowList.length; i++) {
            if (assignRowList[i].length == 1) {
                //分行之后进行分列
                if (assignRowList[i][0].children && assignRowList[i].name == 'Row') {
                    assignRowList[i][0].children = handleSpan(assignRowList[i][0].children);
                }
                rowList.push(assignRowList[i][0]);
            } else {
                let currRow = [],
                    currDivX = 0,
                    currDivY = 0,
                    currMaxX = 0,
                    currMaxY = 0,
                    zIndex = 0;
                currRow = assignRowList[i].sort((a, b) => a.structure.x - b.structure.x);
                zIndex = currRow[0].structure.zIndex;
                for (let j = 0; j < currRow.length; j++) {
                    zIndex = currRow[j].structure.zIndex > zIndex ? currRow[j].structure.zIndex : zIndex;
                    if (j == 0) {
                        currDivX = currRow[j].structure.x;
                        currDivY = currRow[j].structure.y;
                        currMaxX = currRow[j].structure.x + currRow[j].structure.width;
                        currMaxY = currRow[j].structure.y + currRow[j].structure.height;
                    } else {
                        if (currDivX > currRow[j].structure.x) {
                            currDivX = currRow[j].structure.x
                        }
                        if (currDivY > currRow[j].structure.y) {
                            currDivY = currRow[j].structure.y
                        }
                        if (currMaxX < currRow[j].structure.x + currRow[j].structure.width) {
                            currMaxX = currRow[j].structure.x + currRow[j].structure.width;
                        }
                        if (currMaxY < currRow[j].structure.y + currRow[j].structure.height) {
                            currMaxY = currRow[j].structure.y + currRow[j].structure.height;
                        }
                    }
                }
                //分行之后进行分列表
                let currWidth = currMaxX - currDivX;
                let currX = currDivX;
                //特征分列
                let item = isLeftImgRightInfo({
                    id: uniqueId(),
                    class: 'Row',
                    type: 'Container',
                    name: 'Row',
                    structure: {
                        zIndex,
                        x: currX,
                        y: currDivY,
                        width: currWidth,
                        height: currMaxY - currDivY,
                    },
                    children: currRow,
                    style: {}
                });
                // if (parent && parent.structure.width) {
                //     currWidth = parent.structure.width;
                //     currX = parent.structure.x;
                //     // 处理border的影响
                //     if (parent.border && parent.border.structure.width) {
                //         currWidth = currWidth - parent.border.structure.width * 2;
                //         currX = currX + parent.border.structure.width;
                //     }
                // }
                rowList.push(item);
            }
        }
    }
    // data = [...data,...positionList];
    data = rowList.sort((a, b) => a.structure.y - b.structure.y);
    data = handleMerge(data);
    //递归处理children
    for (let i = 0; i < data.length; i++) {
        if (Array.isArray(data[i].children) && data[i].children.length > 0) {
            data[i].children = handleRow(data[i].children, data[i]);
        }
    }
    return data;
}

export default handleRow;

