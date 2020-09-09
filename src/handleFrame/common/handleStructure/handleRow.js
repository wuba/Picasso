
const {
    uniqueId
} = require('../../../common/utils');
const {
    CLASS_TYPE
} = require('../../../common/global');

const handleSpan = (data) => {
    let positionList = [];
    let noPostionList = [];
    data.forEach(item => {
        if (item.isPosition) {
            positionList.push(item);
        } else {
            noPostionList.push(item);
        }
    });
    data = noPostionList;
    //让宽度最大的元素放在最前面
    data = data.sort((a, b) => b.width - a.width);
    //处理进行分列
    //同列的元素外面加一个Span容器
    // 结构调整data
    //children本身全部在一行的不需要加Span容器
    let assignSpanList = [];
    for (let i = 0; i < data.length; i++) {
        let flag = true;
        for (let j = 0; j < assignSpanList.length; j++) {
            //属于哪个容器就放到哪个容器中
            for (let n = 0; n < assignSpanList[j].length; n++) {
                if (flag && ((assignSpanList[j][n].x <= data[i].x && data[i].x < (+assignSpanList[j][n].x + assignSpanList[j][n].width)) ||
                    (+assignSpanList[j][n].x < +data[i].x + data[i].width && +data[i].x + data[i].width <= (+assignSpanList[j][n].x + assignSpanList[j][n].width)))) {
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
    let spanList = [];
    for (let i = 0; i < assignSpanList.length; i++) {
        if (assignSpanList[i].length == 1) {
            spanList.push(assignSpanList[i][0]);
        } else {
            let currSpan = [],
                currDivX = 0,
                currDivY = 0,
                currMaxX = 0,
                currMaxY = 0,
                index = '';
            currSpan = assignSpanList[i].sort((a, b) => a.y - b.y);
            // currSpan = assignSpanList[i];
            index = currSpan[0].index;
            for (let j = 0; j < currSpan.length; j++) {
                index = currSpan[j].index > index ? currSpan[j].index : index;
                if (j == 0) {
                    currDivX = currSpan[j].x;
                    currDivY = currSpan[j].y;
                    currMaxX = currSpan[j].x + currSpan[j].width;
                    currMaxY = currSpan[j].y + currSpan[j].height;
                } else {
                    if (currDivX > currSpan[j].x) {
                        currDivX = currSpan[j].x
                    }
                    if (currDivY > currSpan[j].y) {
                        currDivY = currSpan[j].y
                    }
                    if (currMaxX < currSpan[j].x + currSpan[j].width) {
                        currMaxX = currSpan[j].x + currSpan[j].width;
                    }
                    if (currMaxY < currSpan[j].y + currSpan[j].height) {
                        currMaxY = currSpan[j].y + currSpan[j].height;
                    }
                }
            }
            spanList.push({
                index,
                id: uniqueId(),
                name: "Span1",
                class: "Span",
                type: 'Container',
                x: currDivX,
                y: currDivY,
                width: currMaxX - currDivX,
                height: currMaxY - currDivY,
                children: currSpan,
                style: {}
            });
        }
    }
    data = spanList.sort((a, b) => a.x - b.x);
    data = [...data, ...positionList];
    return data;
}

//分行处理
//判断是否为同一行
//同一行给予DIV包裹并且将该行元素作为DIV的子元素
function isSame(data) {
    let flag = true;
    if (Array.isArray(data) && data.length > 2) {
        let firstItemWidth = data[0].width;
        let firstItemHeight = data[0].height;
        data.forEach((item) => {
            if (Math.abs(firstItemWidth - item.width) > 1 || Math.abs(firstItemHeight - item.height) > 1) {
                flag = false;
            }
        })
    }
    return flag;
}
//判断属于左边的图片
const isLeftImg = (layer, parent = '') => {
    //必须为图片类型
    if (layer.type !== 'Image') {
        return false;
    }
    //距离画板左边的距离<100
    if (layer.x > 100) {
        return false;
    }
    //距离画板左边的距离<100
    if (layer.width < 40) {
        return false;
    }
    //父元素必须存在
    if (!parent) {
        return false;
    }
    //容器的宽度>750*0.7
    if (parent.width < 750 * 0.7) {
        return false;
    }
    for (let i = 1; i < parent.children.length; i++) {
        const item = parent.children[i];
        if (item.x < layer.x + layer.width) {
            return false;
        }
    }
    return true;
}

const isLeftImgRightInfo = (item) => {
    if (Array.isArray(item.children) && item.children.length > 3 && isLeftImg(item.children[0], item)) {
        let itemChildren = [...item.children];
        let firstChildren = itemChildren.shift();
        let currSpan = itemChildren;
        let flag = false;
        for (let j = 0; j < currSpan.length; j++) {
            let item = currSpan[j];
            for (let i = j; i < currSpan.length; i++) {
                const itemI = currSpan[i];
                if (
                    (
                        (itemI.x + itemI.width > item.x && item.x >= itemI.x) ||
                        (item.x + item.width > itemI.x && itemI.x >= item.x)
                    ) && (
                        item.y + item.height <= itemI.y ||
                        itemI.y + itemI.height <= item.y
                    )
                ) {
                    flag = true;
                }
            }
        }
        if (flag) {
            let currDivX, currDivY, currMaxX, currMaxY;
            let index = currSpan[0].index;
            for (let j = 0; j < currSpan.length; j++) {
                index = currSpan[j].index > index ? currSpan[j].index : index;
                if (j == 0) {
                    currDivX = currSpan[j].x;
                    currDivY = currSpan[j].y;
                    currMaxX = currSpan[j].x + currSpan[j].width;
                    currMaxY = currSpan[j].y + currSpan[j].height;
                } else {
                    if (currDivX > currSpan[j].x) {
                        currDivX = currSpan[j].x
                    }
                    if (currDivY > currSpan[j].y) {
                        currDivY = currSpan[j].y
                    }
                    if (currMaxX < currSpan[j].x + currSpan[j].width) {
                        currMaxX = currSpan[j].x + currSpan[j].width;
                    }
                    if (currMaxY < currSpan[j].y + currSpan[j].height) {
                        currMaxY = currSpan[j].y + currSpan[j].height;
                    }
                }
            }
            item.name = 'LeftImgRightInfo';
            firstChildren.class_name = 'left';
            firstChildren.class_type = CLASS_TYPE.RELY_ON_PARENT;
            item.children = [firstChildren, {
                index,
                id: uniqueId(),
                name: "Span2",
                class: "Span",
                type: 'Container',
                x: currDivX,
                y: currDivY,
                width: currMaxX - currDivX,
                height: currMaxY - currDivY,
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
const handleMerge = (data) => {
    let leftRItem = {};
    let flag = false;
    for (let i = 0; i < data.length; i++) {
        if (flag) {
            let secondChild = leftRItem.children[1];
            if (data[i].x > secondChild.x - 2) {
                secondChild.children.push({ ...data[i] });
                secondChild.height = data[i].y + data[i].height - secondChild.y;
                leftRItem.height = data[i].y + data[i].height - leftRItem.y;
                if (secondChild.width + secondChild.x < data[i].x + data[i].width) {
                    secondChild.width = data[i].x + data[i].width - secondChild.x;
                }
                leftRItem.width = secondChild.width + secondChild.x - leftRItem.x;
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
const handleRow = (data, parent = '') => {
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
    data = data.sort((a, b) => b.height - a.height);
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
    //             if (data[i].y + data[i].height > item.y && item.y + item.height > data[i].y) {
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
                if (flag && ((assignRowList[j][n].y <= data[i].y && data[i].y < (+assignRowList[j][n].y + assignRowList[j][n].height)) ||
                    (+assignRowList[j][n].y < +data[i].y + data[i].height && +data[i].y + data[i].height <= (+assignRowList[j][n].y + assignRowList[j][n].height)))) {
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
            parent.class = "Row";
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
                    index = '';
                currRow = assignRowList[i].sort((a, b) => a.x - b.x);
                index = currRow[0].index;
                for (let j = 0; j < currRow.length; j++) {
                    index = currRow[j].index > index ? currRow[j].index : index;
                    if (j == 0) {
                        currDivX = currRow[j].x;
                        currDivY = currRow[j].y;
                        currMaxX = currRow[j].x + currRow[j].width;
                        currMaxY = currRow[j].y + currRow[j].height;
                    } else {
                        if (currDivX > currRow[j].x) {
                            currDivX = currRow[j].x
                        }
                        if (currDivY > currRow[j].y) {
                            currDivY = currRow[j].y
                        }
                        if (currMaxX < currRow[j].x + currRow[j].width) {
                            currMaxX = currRow[j].x + currRow[j].width;
                        }
                        if (currMaxY < currRow[j].y + currRow[j].height) {
                            currMaxY = currRow[j].y + currRow[j].height;
                        }
                    }
                }
                //分行之后进行分列表
                let currWidth = currMaxX - currDivX;
                let currX = currDivX;
                //特征分列
                let item = isLeftImgRightInfo({
                    index,
                    id: uniqueId(),
                    class: "Row",
                    type: 'Container',
                    name: 'Row',
                    x: currX,
                    y: currDivY,
                    width: currWidth,
                    height: currMaxY - currDivY,
                    children: currRow,
                    style: {}
                });
                // if (parent && parent.width) {
                //     currWidth = parent.width;
                //     currX = parent.x;
                //     // 处理border的影响
                //     if (parent.border && parent.border.width) {
                //         currWidth = currWidth - parent.border.width * 2;
                //         currX = currX + parent.border.width;
                //     }
                // }
                rowList.push(item);
            }
        }
    }
    // data = [...data,...positionList];
    data = rowList.sort((a, b) => a.y - b.y);
    data = handleMerge(data);
    //递归处理children
    for (let i = 0; i < data.length; i++) {
        if (Array.isArray(data[i].children) && data[i].children.length > 0) {
            data[i].children = handleRow(data[i].children, data[i]);
        }
    }
    return data;
}
if (typeof module !== 'undefined') {
    module.exports = handleRow;
}

