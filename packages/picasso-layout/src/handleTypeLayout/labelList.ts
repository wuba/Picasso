import { utils } from "./utils";
import { Layer } from '../types';

/**
 * 排序方法
 * @param {Array} data 
 */
const sort = (data:Layer[]) => {
    if (!data.length) return data;
    let yList = [data[0].structure.y];
    data.map(item => {
        if (yList[0] != item.structure.y && !yList.includes(item.structure.y)) {
            yList.push(item.structure.y);
        }
    });

    yList = yList.sort((a, b) => a - b);
    let result = [];
    for (let i = 0; i < yList.length; i++) {
        let list = [];
        data.map(item => {
            if (item.structure.y == yList[i]) {
                list.push(item);
            }
        });

        list = list.sort((a, b) => a.structure.x - b.structure.x);
        result = [...result, ...list];
    }
    return result;
};
/**
 *  识别标签列表
 *   1. 标签等宽 只包含文字 允许背景不一致  间距
 */

export const isLabelList = (data, parent) => {
    if (data.length < 3) return false;
    let num = 0; // 记录每行有多少元素
    let first = data[0];
    data.map(item => {
        if (item.structure.y == first.structure.y) {
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
            parent.structure.width += data[1].structure.x - data[0].structure.x - data[0].structure.width
            parent.style.width += data[1].structure.x - data[0].structure.x - data[0].structure.width
            if (parent.style.marginLeft && parent.style.marginLeft == parent.style.marginRight) {
                // 如果父元素位置居中的情况下需要计算偏移量
                parent.style.position = 'relative'
                parent.style.left = (data[1].structure.x - data[0].structure.x - data[0].structure.width) / 2
            }
        }

        return count == data.length;
    } catch (error) {
        console.log(error);
    }
}
export const layoutLabelList = (data, parent) => {
    data = sort(data);
    parent.name = "labelList";
    let first = data[0];

    parent.style = {
        ...parent.style,
        display: "flex",
        "flex-wrap": "wrap",
        "padding-left": data[0].structure.x - parent.structure.x,
        "padding-top": data[0].structure.y - parent.structure.y
    };

    let marginBottom = 0;
    let marginRight = 0;

    marginRight = parent.marginRight || data[1].structure.x - first.structure.x - first.structure.width;
    for (let i = 1; i < data.length; i++) {
        if (first.structure.x == data[i].structure.x) {
            marginBottom = data[i].structure.y - first.structure.y - first.structure.height;
            break;
        }
    }
    for (let item of data) {
        item.style = {
            ...item.style,
            display: "flex",
            flexDirection: "column", //flex布局方向修正
            justifyContent: "center",
            alignItems: "center",
            marginBottom: `${marginBottom}`,
            marginRight: `${marginRight}`
        };
        delete item.style.lineHeight;
        //   item.addClassName = 'item';
        //   item.element = {
        //       tag: "li"
        //   };
    }

    return data;
}
