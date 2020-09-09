const utils = require("./utils");

/**
 * 排序方法
 * @param {Array} data 
 */
const sort = (data = []) => {
    if (!data.length) return data;
    let yList = [data[0].y];
    data.map(item => {
        if (yList[0] != item.y && !yList.includes(item.y)) {
            yList.push(item.y);
        }
    });

    yList = yList.sort((a, b) => a - b);
    let result = [];
    for (let i = 0; i < yList.length; i++) {
        let list = [];
        data.map(item => {
            if (item.y == yList[i]) {
                list.push(item);
            }
        });

        list = list.sort((a, b) => a.x - b.x);
        result = [...result, ...list];
    }
    return result;
};
/**
 *  识别标签列表
 *   1. 标签等宽 只包含文字 允许背景不一致  间距
 */
module.exports = {
    isLabelList(data, parent) {
        if (data.length < 3) return false;
        let num = 0; // 记录每行有多少元素
        let first = data[0];
        data.map(item => {
            if (item.y == first.y) {
                num++;
            }
        });
        //每行只有一条数据的时候，既纵向排列，不适用于此
        if (num === 1) {
            return false;
        }
        data = sort(data);
        try {
            let count = 0;
            for (let i = 0; i < data.length; i++) {
                if (
                    utils.hasTextType(data[i]) &&
                    utils.isEqualHeight(data) &&
                    (utils.isSameSpacing(data) || parent.sign == "__list") &&
                    (utils.hasBackground(data) || utils.hasBorder(data))
                ) {
                    count++;
                }
            }
            if (count == data.length) { // 父元素宽度扩展        
                parent.width += data[1].x - data[0].x - data[0].width
                parent.style.width += data[1].x - data[0].x - data[0].width
                if (parent.style['margin-left'] && parent.style['margin-left'] == parent.style['margin-right']) {
                    // 如果父元素位置居中的情况下需要计算偏移量
                    parent.style.position = 'relative'
                    parent.style.left = (data[1].x - data[0].x - data[0].width) / 2
                }
            }

            return count == data.length;
        } catch (error) {
            console.log(error);
        }
    },
    layoutLabelList(data, parent) {
        data = sort(data);
        parent.name = "labelList";
        let first = data[0];

        parent.style = {
            ...parent.style,
            display: "flex",
            "flex-wrap": "wrap",
            "padding-left": data[0].x - parent.x,
            "padding-top": data[0].y - parent.y
        };

        let marginBottom = 0;
        let marginRight = 0;

        marginRight = parent.marginRight || data[1].x - first.x - first.width;
        for (let i = 1; i < data.length; i++) {
            if (first.x == data[i].x) {
                marginBottom = data[i].y - first.y - first.height;
                break;
            }
        }
        for (let item of data) {
            item.style = {
                ...item.style,
                display: "flex",
                "flex-direction": "column", //flex布局方向修正
                "justify-content": "center",
                "align-items": "center",
                "margin-bottom": `${marginBottom}`,
                "margin-right": `${marginRight}`
            };
            delete item.style["line-height"];
            //   item.addClassName = 'item';
            //   item.element = {
            //       tag: "li"
            //   };
        }

        return data;
    }
};
