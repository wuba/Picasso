
import {
    isSingleText,
    isAlignCenter,
    isOnlyContainer,
    utils
} from "./handleTypeLayout";

import {
    CLASS_TYPE
} from './const';
import { Layer } from './types';

/**
 * 规则
 * 1.父元素width不为auto
 * @param {Array} data
 * @param {Object} parent
 */
const isTowSpan = (data: Layer[], parent: Layer) => {
    // if (data.length == 2 && parent.structure.width != "auto") {
    if (data.length == 2 && parent) {
        let firstItem = data[0];
        let secondItem = data[1];
        if (
            firstItem.structure.x + firstItem.structure.width / 2 < parent.structure.x + parent.structure.width / 2 &&
            secondItem.structure.x >= parent.structure.x + parent.structure.width / 2 &&
            (secondItem.structure.x - firstItem.structure.x - firstItem.structure.width) * 0.2 >
            parent.structure.width + parent.structure.x - secondItem.structure.x - secondItem.structure.width &&
            parent.structure.width > 750 * 0.7
        ) {
            return true;
        }
    }
};

const layoutTowSpan = (data: Layer[], parent: Layer) => {
    let firstItem = data[0];
    let secondItem = data[1];
    firstItem.class_name = 'left';
    firstItem.class_type = CLASS_TYPE.RELY_ON_PARENT;
    secondItem.class_name = 'right';
    secondItem.class_type = CLASS_TYPE.RELY_ON_PARENT;
    parent.style = {
        ...parent.style,
        display: "flex",
        justifyContent: "space-between",
        flexDirection: 'row',
    };

    if (utils.isAlignMiddle(data, parent)) {
        if (!utils.isSameParentHeight(data, parent)) {
            parent.style = {
                ...parent.style,
                alignItems: "center"
            };
        }
    } else {
        firstItem.style = {
            ...firstItem.style,
            marginTop: firstItem.structure.y - parent.structure.y
        };

        secondItem.style = {
            ...secondItem.style,
            marginTop: secondItem.structure.y - parent.structure.y
        };
    }

    firstItem.style = {
        ...firstItem.style,
        marginLeft: firstItem.structure.x - parent.structure.x
    };
    if (isSingleText(firstItem) || isOnlyContainer(firstItem)) {
        delete firstItem.style.width;
    }
    secondItem.style = {
        ...secondItem.style,
        marginRight: parent.structure.x + parent.structure.width - secondItem.structure.x - secondItem.structure.width
    };

    if (
        isSingleText(secondItem) ||
        (isOnlyContainer(secondItem) &&
            secondItem.children &&
            secondItem.children.length < 2)
    ) {
        delete secondItem.style.width;
    }

    return data;
};

// 判断是否是图片文案居中的情况
const isimgTextCeneter = (data: Layer[], parent: Layer) => {
    if (data.length !== 2) return false; // 只有两个元素的情况
    const isAlignCenter = (data, parent) => {
        // 两个元素组合位于父元素中间
        let firstItem = data[0];
        let secondItem = data[1];
        let leftDis = firstItem.structure.x - parent.structure.x;
        let rightDis = parent.structure.x + parent.structure.width - secondItem.structure.x - secondItem.structure.width;

        return Math.abs(leftDis - rightDis) < 2;
    };

    let existImgLayer = data.find(item => item.type == "Image");
    let existTextLayer = data.find(item => item.type == "Text");

    if (existImgLayer && existTextLayer && isAlignCenter(data, parent)) {
        return true;
    }
    return false;
};

const layoutImgTextCeneter = (data: Layer[], parent: Layer) => {
    let firstItem = data[0];
    let secondItem = data[1];
    if (
        isSingleText(firstItem)
    ) {
       delete firstItem.style.width;
    }
    if (
        isSingleText(secondItem)
    ) {
        delete secondItem.style.width;
    }
    parent.style = {
        ...parent.style,
        display: "flex",
        flexDirection: 'row',
    };

    if (!utils.isHorizontalCloseParent(data, parent)) {
        parent.style = {
            ...parent.style,
            justifyContent: "center"
        };
    }

    if (utils.isAlignMiddle(data, parent)) {
        if (!utils.isVerticalCloseParent(data, parent)) {
            parent.style = {
                ...parent.style,
                alignItems: "center"
            };
        }
    } else {
        for (let item of data) {
            item.style = {
                ...item.style,
                marginTop: item.structure.y - parent.structure.y
            }
        }
    }

    secondItem.style = {
        ...secondItem.style,
        marginLeft: secondItem.structure.x - firstItem.structure.x - firstItem.structure.width
    };

    return data;
};
const isEqualBolck = (data: Layer[], parent: Layer) => {
    if (
        data.length >= 2 &&
        utils.isEqualWidth(data) &&
        utils.isEqualHeight(data) &&
        utils.isSameSpacing(data) &&
        data[0].structure.x == parent.structure.x &&
        Math.abs(
            data[data.length - 1].structure.x +
            data[data.length - 1].structure.width -
            parent.structure.x -
            parent.structure.width
        ) < 2
    ) {
        // 至少两个子元素
        return true;
    }
    return false;
};

const layoutEqualBlock = (data: Layer[], parent: Layer) => {
    parent.style = {
        ...parent.style,
        display: "flex",
        justifyContent: "space-between"
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
        let firstBetween = data[1].structure.x + data[1].structure.width * 0.5 - (data[0].structure.x + data[0].structure.width * 0.5);
        for (let i = 2; i < data.length; i++) {
            const item = data[i];
            if (item.name != "ItemList") {
                return false;
            }
            if (
                Math.abs(
                    data[i].structure.x + data[i].structure.width * 0.5 - (data[i - 1].structure.x + data[i - 1].structure.width * 0.5) - firstBetween
                ) > 4
            ) {
                return false;
            }
        }
        return true;
    }
    return false;
};

const layoutBetweenItemList = (data: Layer[], parent: Layer) => {
    parent.style = {
        ...parent.style,
        display: "flex",
        flexDirection: 'row',
        justifyContent: "space-between",
    };
    for (let i = 0; i < data.length; i++) {
        if (!data[i].style) {
            data[i].style = {};
        }
        data[i].class_name = "li";
        data[i].class_type = CLASS_TYPE.RELY_ON_CHILD_AND_PARENT;
    }
    if (isAlignCenter(data, parent)) {
        parent.style = {
            ...parent.style,
            alignItems: "center"
        };
    } else {
        for (let i = 0; i < data.length; i++) {
            data[i].style = {
                ...data[i].style,
                marginTop: data[i].structure.y - parent.structure.y
            };
        }
    }
    //第一个元素
    if (data[0].structure.x != parent.structure.x) {
        parent.style = {
            ...parent.style,
            paddingLeft: data[0].structure.x - parent.structure.x
        };
    }
    //最后一个元素
    if (
        data[data.length - 1].structure.x + data[data.length - 1].structure.width !=
        parent.structure.x + parent.structure.width
    ) {
        parent.style = {
            ...parent.style,
            paddingRight: parent.structure.x
            + parent.structure.width -data[data.length - 1].structure.x
            - data[data.length - 1].structure.width
        };
    }
    //不设置宽度
    for (let i = 0; i < data.length; i++) {
        delete data[i].style.width
    }
    return data;
}

/**
 * 行布局
 */
export const isRow = (data) => {
    let flag = true;
    if (Array.isArray(data) && data.length > 1) {
        data = data.sort((a, b) => a.structure.x - b.structure.x);
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            flag = false;
            for (let j = i; j < data.length; j++) {
                const itemJ = data[j];
                if (
                    (item.structure.y <= itemJ.structure.y && itemJ.structure.y < item.structure.y + item.structure.width) ||
                    (itemJ.structure.y <= item.structure.y && item.structure.y < itemJ.structure.y + itemJ.structure.width)
                ) {
                    flag = true;
                }
            }
        }
    }
    return flag;
}


export const layoutRow = (data, parent) => {
    if (Array.isArray(data) && data.length > 1) {
        data = data.sort((a, b) => a.structure.x - b.structure.x);
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
                flexDirection: "row"
            };
            // 水平居中
            if (parent.isCenter) {
                parent.style = {
                    ...parent.style,
                    width: "auto",
                    justifyContent: "center"
                };
                delete parent.style.marginLeft;
            }
            // 垂直方向
            if (utils.isAlignMiddle(data, parent)) {
                if (!utils.isSameParentHeight(data, parent)) {
                    parent.style = {
                        ...parent.style,
                        alignItems: "center"
                    };
                }
            } else {
                for (let i = 0; i < data.length; i++) {
                    data[i].style = {
                        ...data[i].style,
                        marginTop: data[i].structure.y - parent.structure.y
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
                        marginLeft: item.structure.x - parent.structure.x
                    };
                } else {
                    data[i].style = {
                        ...data[i].style,
                        marginLeft: item.structure.x - data[i - 1].structure.x - data[i - 1].structure.width
                    };
                }
            }
            if (
                (isSingleText(data[data.length - 1]) &&
                    data[data.length - 1].style.textAlign === "left") ||
                isOnlyContainer(data[data.length - 1])
            ) {
                data[data.length - 1].style.width = "auto";
            }
        }
    }

    return data;
}
