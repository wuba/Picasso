import { Layer } from '../types';

// 公用方法
export const utils = {
    // 判断是否等宽
    isEqualWidth(data: Layer[]) {
        // 判断所有的元素是否等宽
        let setList = new Set();
        for (let item of data) {
            setList.add(item.structure.width);
        }
        let ary = [...new Set(setList)];
        return ary.length == 1 ? true : false;
    },

    // 判断所有的子元素是否中线对齐
    isAlignMiddle(data: Layer[], parent: Layer) {
        let middlePos = parent.structure.y + parent.structure.height / 2;
        let isAlignMiddle = true;

        for (let i = 0; i < data.length; i++) {
            let item = data[i];
            if (Math.abs(item.structure.y + item.structure.height / 2 - middlePos) > 2) {
                // 允许 2px 误差
                isAlignMiddle = false;
                break;
            }
        }

        return isAlignMiddle;
    },

    isEqualHeight(data: Layer[]) {
        // 判断所有的元素是否等宽
        let setList = new Set();
        for (let item of data) {
            setList.add(item.structure.height);
        }
        let ary = [...new Set(setList)];
        return ary.length == 1 ? true : false;
    },

    // 第一层级只包含一个文本节点
    hasTextType(data: Layer) {
        if (data.type == "Text") return true; // 自身是文本的情况返回 true
        if (data.children) {
            let textList = [];
            for (let item of data.children) {
                if (item.type == "Text") {
                    textList.push(item);
                }
            }
            return textList.length == 1;
        }

        return false;
    },

    // 多行之间判断是否是否相同间距
    isSameSpacing(data: Layer[]) {
        let flag = true;
        let space = data[1].structure.x - data[0].structure.x - data[0].structure.width;

        for (let i = 1; i < data.length; i++) {
            if (
                data[i].structure.y == data[i - 1].structure.y &&
                Math.abs(data[i].structure.x - data[i - 1].structure.x - data[i - 1].structure.width - space) > 4 ||
                (!data[i].structure.x && data[i].structure.x !== 0)
            ) {
                flag = false;
                break;
            }
        }

        return flag;
    },

    // 是否有边框
    hasBorder(data: Layer[]) {
        let flag = true;
        for (let i = 0; i < data.length; i++) {
            let item = data[i];
            if (!(item.structure?.border)) {
                flag = false;
                break;
            }
        }
        return flag;
    },

    // 是否有背景
    hasBackground(data: Layer[]) {
        let flag = true;
        for (let i = 0; i < data.length; i++) {
            let item = data[i];
            if (item.style?.background) {
                flag = false;
                break;
            }
        }
        return flag;
    },

    // 判断所有的子元素和父元素的高度是否一致
    isSameParentHeight(data: Layer[], parent: Layer) {
        let flag = true;

        for (let i = 0; i < data.length; i++) {
            let item = data[i];
            if (item.structure.height != parent.structure.height) {
                flag = false;
                break;
            }
        }
        return flag;
    },

    // 判断水平方向子元素贴近父元素
    isHorizontalCloseParent(data: Layer[], parent: Layer) {
        if (data.length < 2) return false;
        // 两个元素组合位于父元素中间
        return (
            data[0].structure.x == parent.structure.x &&
            Math.abs(
                data[data.length - 1].structure.x +
                data[data.length - 1].structure.width -
                parent.structure.x -
                parent.structure.width
            ) < 2
        );
    },

    // 判断垂直方向子元素贴近父元素
    isVerticalCloseParent(data: Layer[], parent: Layer) {
        if (data.length < 2) return false;
        // 两个元素组合位于父元素中间
        return (
            data[0].structure.y == parent.structure.y &&
            Math.abs(
                data[data.length - 1].structure.y +
                data[data.length - 1].structure.height -
                parent.structure.y -
                parent.structure.height
            ) < 2
        );
    }
};
