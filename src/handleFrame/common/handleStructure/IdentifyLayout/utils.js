// 公用方法
module.exports = {
    isEqualWidth(data) {
        // 判断所有的元素是否等宽
        let setList = new Set();
        for (let item of data) {
            setList.add(item.width);
        }
        let ary = [...new Set(setList)];
        return ary.length == 1 ? true : false;
    },

    isEqualHeight(data) {
        if (data.length < 2) return false;
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
        let flag = false;
        for (let item of data) {
            if (
                item.type == "Container" &&
                item.children &&
                item.children.length
            ) {
                let textList = [];
                for (let subItem of item.children) {
                    if (subItem.type == 'Text') {
                        textList.push(subItem.name)
                    }
                }
                flag = textList.length == 1;
                if (!flag) {
                    break;
                }
            }
        }

        return flag
    },

    // 多行之间判断是否是否相同间距
    isSameSpacing(data) {
        if (data.length < 2) return false;
        let flag = true;
        let space = data[1].x - data[0].x - data[0].width;

        for (let i = 2; i < data.length; i++) {
            if (
                data[i].y == data[i - 1].y &&
                Math.abs(data[i].x - data[i - 1].x - data[i - 1].width - space) > 2
            ) {
                flag = false;
                break;
            }
        }

        return flag;
    },

    hasBorder(data) {
        let flag = true;
        for (let item of data) {
            if (!(item.border && item.border.width)) {
                flag = false;
            }
        }
        return flag;
    },

    hasBackground(data) {
        let flag = true;
        for (let item of data) {
            if (!(item.style && item.style['background-color'])) {
                flag = false;
            }
        }
        return flag;
    }
};
