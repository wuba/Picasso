// 公用方法
module.exports = {
    // 判断是否等宽
    isEqualWidth(data) {
        // 判断所有的元素是否等宽
        let setList = new Set();
        for (let item of data) {
            setList.add(item.width);
        }
        let ary = [...new Set(setList)];
        return ary.length == 1 ? true : false;
    },

    // 判断所有的子元素是否中线对齐
    isAlignMiddle(data, parent) {
        let middlePos = parent.y + parent.height / 2;
        let isAlignMiddle = true;

        for (let i = 0; i < data.length; i++) {
            let item = data[i];
            if (Math.abs(item.y + item.height / 2 - middlePos) > 2) {
                // 允许 2px 误差
                isAlignMiddle = false;
                break;
            }
        }

        return isAlignMiddle;
    },

    isEqualHeight(data) {
        // 判断所有的元素是否等宽
        let setList = new Set();
        for (let item of data) {
            setList.add(item.height);
        }
        let ary = [...new Set(setList)];
        return ary.length == 1 ? true : false;
    },

    // 第一层级只包含一个文本节点
    hasTextType(data) {
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
    isSameSpacing(data) {
        let flag = true;
        let space = data[1].x - data[0].x - data[0].width;

        for (let i = 1; i < data.length; i++) {
            if (
                data[i].y == data[i - 1].y &&
                Math.abs(data[i].x - data[i - 1].x - data[i - 1].width - space) > 4
            ) {
                flag = false;
                break;
            }
        }

        return flag;
    },

    // 是否有边框
    hasBorder(data) {
        let flag = true;
        for (let i = 0; i < data.length; i++) {
            let item = data[i];
            if (!(item.border && item.border.width)) {
                flag = false;
                break;
            }
        }
        return flag;
    },

    // 是否有背景
    hasBackground(data) {
        let flag = true;
        for (let i = 0; i < data.length; i++) {
            let item = data[i];
            if (!(item.style && item.style["background-color"])) {
                flag = false;
                break;
            }
        }
        return flag;
    },

    // 判断所有的子元素和父元素的高度是否一致
    isSameParentHeight(data, parent) {
        let flag = true;

        for (let i = 0; i < data.length; i++) {
            let item = data[i];
            if (item.height != parent.height) {
                flag = false;
                break;
            }
        }
        return flag;
    },

    // 判断水平方向子元素贴近父元素
    isHorizontalCloseParent(data, parent) {
        if (data.length < 2) return false;
        // 两个元素组合位于父元素中间
        return (
            data[0].x == parent.x &&
            Math.abs(
                data[data.length - 1].x +
                data[data.length - 1].width -
                parent.x -
                parent.width
            ) < 2
        );
    },

    // 判断垂直方向子元素贴近父元素
    isVerticalCloseParent(data, parent) {
        if (data.length < 2) return false;
        // 两个元素组合位于父元素中间
        return (
            data[0].y == parent.y &&
            Math.abs(
                data[data.length - 1].y +
                data[data.length - 1].height -
                parent.y -
                parent.height
            ) < 2
        );
    }
};
