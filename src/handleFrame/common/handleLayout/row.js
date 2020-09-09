
const isSingleText = require("./handleTypeLayout/isSingleText");
const isOnlyContainer = require("./handleTypeLayout/isOnlyContainer");
const isBetweenCenter = require("./handleTypeLayout/isAlignCenter");
const utils = require("./handleTypeLayout/utils");

const {
    CLASS_TYPE
} = require('../../../common/global');

/**
 * 规则
 * 1.父元素width不为auto
 * @param {Array} data
 * @param {Object} parent
 */
const isTowSpan = (data, parent) => {
    if (data.length == 2 && parent && parent.width != "auto") {
        let firstItem = data[0];
        let secondItem = data[1];
        if (
            firstItem.x + firstItem.width / 2 < parent.x + parent.width / 2 &&
            secondItem.x >= parent.x + parent.width / 2 &&
            (secondItem.x - firstItem.x - firstItem.width) * 0.2 >
            parent.width + parent.x - secondItem.x - secondItem.width &&
            parent.width > 750 * 0.7
        ) {
            return true;
        }
    }
};

const layoutTowSpan = (data, parent) => {
    let firstItem = data[0];
    let secondItem = data[1];
    firstItem.class_name = 'left';
    firstItem.class_type = CLASS_TYPE.RELY_ON_PARENT;
    secondItem.class_name = 'right';
    secondItem.class_type = CLASS_TYPE.RELY_ON_PARENT;
    parent.style = {
        ...parent.style,
        display: "flex",
        "justify-content": "space-between"
    };

    if (utils.isAlignMiddle(data, parent)) {
        if (!utils.isSameParentHeight(data, parent)) {
            parent.style = {
                ...parent.style,
                "align-items": "center"
            };
        }
    } else {
        firstItem.style = {
            ...firstItem.style,
            "margin-top": firstItem.y - parent.y
        };

        secondItem.style = {
            ...secondItem.style,
            "margin-top": secondItem.y - parent.y
        };
    }

    firstItem.style = {
        ...firstItem.style,
        "margin-left": firstItem.x - parent.x
    };
    if (isSingleText(firstItem) || isOnlyContainer(firstItem)) {
        firstItem.style.width = "auto";
    }
    secondItem.style = {
        ...secondItem.style,
        "margin-right": parent.x + parent.width - secondItem.x - secondItem.width
    };

    if (
        isSingleText(secondItem) ||
        (isOnlyContainer(secondItem) &&
            secondItem.children &&
            secondItem.children.length < 2)
    ) {
        secondItem.style.width = "auto";
    }

    return data;
};

// 判断是否是图片文案居中的情况
const isimgTextCeneter = (data, parent) => {
    if (data.length !== 2) return false; // 只有两个元素的情况
    const isAlignCenter = (data, parent) => {
        // 两个元素组合位于父元素中间
        let firstItem = data[0];
        let secondItem = data[1];
        let leftDis = firstItem.x - parent.x;
        let rightDis = parent.x + parent.width - secondItem.x - secondItem.width;

        return Math.abs(leftDis - rightDis) < 2;
    };

    let existImgLayer = data.find(item => item.type == "Image");
    let existTextLayer = data.find(item => item.type == "Text");

    if (existImgLayer && existTextLayer && isAlignCenter(data, parent)) {
        return true;
    }
    return false;
};

const layoutImgTextCeneter = (data, parent) => {
    let firstItem = data[0];
    let secondItem = data[1];
    if (
        isSingleText(firstItem)
    ) {
        firstItem.style.width = "auto";
    }
    if (
        isSingleText(secondItem)
    ) {
        secondItem.style.width = "auto";
    }
    parent.style = {
        ...parent.style,
        display: "flex"
    };

    if (!utils.isHorizontalCloseParent(data, parent)) {
        parent.style = {
            ...parent.style,
            "justify-content": "center"
        };
    }

    if (utils.isAlignMiddle(data, parent)) {
        if (!utils.isVerticalCloseParent(data, parent)) {
            parent.style = {
                ...parent.style,
                "align-items": "center"
            };
        }
    } else {
        for (let item of data) {
            item.style = {
                ...item.style,
                "margin-top": item.y - parent.y
            }
        }
    }

    secondItem.style = {
        ...secondItem.style,
        "margin-left": secondItem.x - firstItem.x - firstItem.width
    };

    return data;
};
const isEqualBolck = (data, parent) => {
    if (
        data.length >= 2 &&
        utils.isEqualWidth(data) &&
        utils.isEqualHeight(data) &&
        utils.isSameSpacing(data) &&
        data[0].x == parent.x &&
        Math.abs(
            data[data.length - 1].x +
            data[data.length - 1].width -
            parent.x -
            parent.width
        ) < 2
    ) {
        // 至少两个子元素
        return true;
    }
    return false;
};

const layoutEqualBlock = (data, parent) => {
    parent.style = {
        ...parent.style,
        display: "flex",
        "justify-content": "space-between"
    };
    data = data.map(item => {
        item.class_name = 'li';
        item.class_type = CLASS_TYPE.RELY_ON_CHILD_AND_PARENT;
        return item;
    });
    return data;
};
const isBetweenItemList = (data, parent) => {
    if (Array.isArray(data) && data.length > 2 && parent) {
        let firstBetween = data[1].x + data[1].width * 0.5 - (data[0].x + data[0].width * 0.5);
        for (let i = 2; i < data.length; i++) {
            const item = data[i];
            if (item.name != "ItemList") {
                return false;
            }
            if (
                Math.abs(
                    data[i].x + data[i].width * 0.5 - (data[i - 1].x + data[i - 1].width * 0.5) - firstBetween
                ) > 4
            ) {
                return false;
            }
        }
        return true;
    }
    return false;
};

const layoutBetweenItemList = (data, parent) => {
    parent.style = {
        ...parent.style,
        display: "flex",
        "justify-content": "space-between"
    };
    for (let i = 0; i < data.length; i++) {
        if (!data[i].style) {
            data[i].style = {};
        }
        data[i].class_name = "li";
        data[i].class_type = CLASS_TYPE.RELY_ON_CHILD_AND_PARENT;
    }
    if (isBetweenCenter(data, parent)) {
        parent.style = {
            ...parent.style,
            "align-items": "center"
        };
    } else {
        for (let i = 0; i < data.length; i++) {
            data[i].style = {
                ...data[i].style,
                "margin-top": data[i].y - parent.y
            };
        }
    }
    //第一个元素
    if (data[0].x != parent.x) {
        parent.style = {
            ...parent.style,
            "padding-left": data[0].x - parent.x
        };
    }
    //最后一个元素
    if (
        data[data.length - 1].x + data[data.length - 1].width !=
        parent.x + parent.width
    ) {
        parent.style = {
            ...parent.style,
            "padding-right":
                parent.x +
                parent.width -
                data[data.length - 1].x -
                data[data.length - 1].width
        };
    }
    //不设置宽度
    for (let i = 0; i < data.length; i++) {
        data[i].style['width'] = 'auto';
    }
    return data;
};
/**
 * 行布局
 */
module.exports = {
    isRow(data) {
        let flag = true;
        if (Array.isArray(data) && data.length > 1) {
            data = data.sort((a, b) => a.x - b.x);
            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                flag = false;
                for (let j = i; j < data.length; j++) {
                    const itemJ = data[j];
                    if (
                        (item.y <= itemJ.y && itemJ.y < item.y + item.width) ||
                        (itemJ.y <= item.y && item.y < itemJ.y + itemJ.width)
                    ) {
                        flag = true;
                    }
                }
            }
        }
        return flag;
    },
    layoutRow(data, parent) {
        if (Array.isArray(data) && data.length > 1) {
            data = data.sort((a, b) => a.x - b.x);
            if (parent) {

                if (!parent.style) {
                    parent.style = {};
                }
                //两列两边对齐样式
                if (isTowSpan(data, parent)) {
                    return layoutTowSpan(data, parent);
                }
                //itemList情况切符合间距相同
                if (isBetweenItemList(data, parent)) {
                    return layoutBetweenItemList(data, parent);
                }
                // 多个子元素，宽度一样，第一个和最后一个紧挨父元素情况
                if (isEqualBolck(data, parent)) {
                    return layoutEqualBlock(data, parent);
                }
                // // 子元素组合位于父元素中间位置， 所有子元素垂直方向上居中
                if (isimgTextCeneter(data, parent)) {
                    return layoutImgTextCeneter(data, parent);
                }
                parent.style = {
                    ...parent.style,
                    display: "flex",
                    "flex-direction": "row"
                };
                // 水平居中
                if (parent.isCenter) {
                    parent.style = {
                        ...parent.style,
                        width: "auto",
                        "justify-content": "center"
                    };
                    delete parent.style["margin-left"];
                }
                // 垂直方向
                if (utils.isAlignMiddle(data, parent)) {
                    if (!utils.isSameParentHeight(data, parent)) {
                        parent.style = {
                            ...parent.style,
                            "align-items": "center"
                        };
                    }
                } else {
                    for (let i = 0; i < data.length; i++) {
                        data[i].style = {
                            ...data[i].style,
                            "margin-top": data[i].y - parent.y
                        };
                    }
                }

                for (let i = 0; i < data.length; i++) {
                    const item = data[i];
                    if (!data[i].style) {
                        data[i].style = {};
                    }

                    if (i == 0) {
                        data[i].style = {
                            ...data[i].style,
                            "margin-left": item.x - parent.x
                        };
                    } else {
                        data[i].style = {
                            ...data[i].style,
                            "margin-left": item.x - data[i - 1].x - data[i - 1].width
                        };
                    }
                }
                if (
                    (isSingleText(data[data.length - 1]) &&
                        data[data.length - 1].style["text-align"] == "left") ||
                    isOnlyContainer(data[data.length - 1])
                ) {
                    data[data.length - 1].style.width = "auto";
                }
            }
        }
        return data;
    }
};
