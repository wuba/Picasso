import { Layer } from './types';
import handleOverlap from "./handleOverlap";
import calculateRow from "./calculateRow";
import isBlock from "./isBlock";
import calculateBlock from "./calculateBlock";
import handleParentIsText from "./handleParentIsText";
import markIsOnlyText from "./markIsOnlyText";
import {
    isRow,
    layoutRow
} from "./row";

// 特殊布局识别
import {
    isLabelList,
    layoutLabelList,
    isSingleText
} from "./handleTypeLayout";

import {
    isVerticalList,
    calculateVerticalList,
    isLeftImgRightInfo,
    calculateLeftImgRightInfo,
    handleContinuousListItem,
} from './calculateClassName';

import * as fs from 'fs';

/**
 * 布局
 * @param {Layer[]} data
 * @param {Layer} parent
 * @returns
 */
const handleLayout = (data:Layer[], parent?:Layer) => {
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
    if (isLeftImgRightInfo(data)) {
        data = calculateLeftImgRightInfo(data);
    }
    if (isVerticalList(data)) {
        data = calculateVerticalList(data);
    } else {
        data = handleContinuousListItem(data);
    }

    // fs.writeFileSync('./code_dsl_100.json',JSON.stringify(data,null,2));

    switch (true) {
    case parent === undefined:
        data = calculateRow(data);
        break;
    case parent && parent.textContainer: //一行文本多个样式不走布局
        break;
    case parent && parent._class == "text": // 父元素是文本，子元素接对定位（目前没有进到这里）
        data = handleParentIsText(data, parent);
        break;
    case isLabelList(data, parent): // 标签列表，目前多段文本会走此处
        data = layoutLabelList(data, parent);
        break;
    case isBlock(data):
        data = calculateBlock(data, parent);
        break;
    case isRow(data):
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
            // 单行文本宽度是否全去掉
            try {
                if (isSingleText(data[i])) {
                    delete data[i].style.width;
                    //避免纵向排列的,右对齐的部分，text-align=right 也要去掉
                    if (data.length > 1 && data[i].style.textAlign == 'right' && parent && data[i].structure.width < parent.structure.width * 0.9) {
                        delete data[i].style.textAlign;
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

    // fs.writeFileSync('./code_dsl_103.json',JSON.stringify(data,null,2));

    return data;
};

export default handleLayout;
