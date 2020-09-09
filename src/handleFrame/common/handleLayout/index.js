const handleOverlap = require("./handleOverlap");
const calculateRow = require("./calculateRow");
const isBlock = require("./isBlock");
const calculateBlock = require("./calculateBlock");
const handleParentIsText = require("./handleParentIsText");
const markIsOnlyText = require("./markIsOnlyText");
const {
    isRow,
    layoutRow
} = require("./row");
// 特殊布局识别
const {
    labelList,
    isSingleText
} = require("./handleTypeLayout");

const {
    isVerticalList,
    calculateVerticalList,
    isLeftImgRightInfo,
    calculateLeftImgRightInfo,
    handleContinuousListItem,
} = require('./calculateClassName');

/**
 * 布局
 * @param {Array} data
 * @param {string} [parent='']
 * @returns
 */
const handleLayout = (data, parent = "") => {
    //使用绝对定位的图层数组
    let dataIsPositionLayout = [];
    //不使用绝对定位的图层数组
    let dataIsNotPositionLayout = [];
    //图层分组
    data.forEach((item) => {
        if (parent && item.isPosition) {
            dataIsPositionLayout.push(item);
        } else {
            dataIsNotPositionLayout.push(item);
        }
    });

    data = dataIsNotPositionLayout;
    // 竖向列表
    if (isLeftImgRightInfo(data, parent)) {
        data = calculateLeftImgRightInfo(data, parent);
    }
    if (isVerticalList(data, parent)) {
        data = calculateVerticalList(data, parent);
    } else {
        data = handleContinuousListItem(data, parent);
    }
    switch (true) {
    case parent == "":
        data = calculateRow(data);
        break;
    case parent && parent.textContainer: //一行文本多个样式不走布局
        break;
    case parent && parent._class == "text":
        data = handleParentIsText(data, parent);
        break;
    case labelList.isLabelList(data, parent):
        data = labelList.layoutLabelList(data, parent);
        break;
    case isBlock(data, parent):
        data = calculateBlock(data, parent);
        break;
    case isRow(data, parent):
        data = layoutRow(data, parent);
        break;
    default:
        break;
    }
    if (parent) {
        markIsOnlyText(data, parent);
    }
    //使用绝对定位的布局
    data = handleOverlap(dataIsPositionLayout, parent, data);
    //递归子集
    if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
            //单行文本宽度是否全去掉
            try {
                if (isSingleText(data[i])) {
                    data[i].style['width'] = 'auto';
                    //避免纵向排列的,右对齐的部分，text-align=right 也要去掉
                    if (data.length > 1 && data[i].style['text-align'] == 'right' && parent && data[i].width < parent.width * 0.9) {
                        delete data[i].style['text-align'];
                    }
                }
            } catch (error) {
                console.log('文本宽度剔除异常' + error);
            }
            if (Array.isArray(data[i].children) && data[i].children.length > 0) {
                data[i].children = handleLayout(data[i].children, data[i]);
            }
        }
    }
    return data;
};

module.exports = handleLayout;
