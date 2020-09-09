/**
 * 专门处理文本的方法
 * 以 ：
 *  {
 *     type: 'Text'，
 *     val: ''
 *  }
 * 如果包含 br 表示是多行： 直接处理为 p 标签的形式
 * 如果加粗 一般情况下处理为 h4 标签
 * 如果子 children > 2 全部是文本的情况下， 且间距  12-16px 是 h4 否则是  18px 以上 700 表示 h3
 *
 * 如果父元素是文本的情况， 则子元素不会进行合并操作, 同时将子元素进行定位
 *
 */

const { isAlignCenter } = require("../../../common/utils");

// 判断
const isTightText = layer => {
    let len = 0;
    for (let char of layer.text) {
        if (/[\u4e00-\u9fa5]/.test(char)) {
            len += 1; // 汉字加 1
        } else {
            len += 0.5; // 非汉字加 0.5
        }
    }

    if (
        layer.style["font-size"] * len <= layer.width &&
        layer.style["font-size"] * (len + 1) >= layer.width
    ) {
        return true;
    }

    return false;
};

/**
 *
 * @param {*} data
 * 判断所有的子 children 是否都是文本的形式
 */
const isAllText = data => {
    let isAllText = true;
    data.forEach(item => {
        if (item.type != "Text") {
            isAllText = false;
        }
    });
    return isAllText;
};

// 判断子元素是否都在同一行
const isSameRow = data => {
    let isSameRow = true;
    for (var i = 1; i < data.length; i++) {
        if (data[i - 1].y + data[i - 1].height <= data[i].y) {
            isSameRow = false;
        }
    }
    return isSameRow;
};

var simplifyText = data => {
    if (!data) return [];
    for (var i = 0; i < data.length; i++) {
        let item = data[i];
        if (
            item.children &&
            item.children.length == 1 &&
            item.children[0].type == "Text" &&
            data[i].y <= data[i].children[0].y &&
            item.type != "Text" &&
            !item.style["position"] &&
            item._class != "bitmap"
        ) {
            // 只有一个文本子元素, 保证内部文本不存在溢出的情况
            let singleChild = data[i].children[0];
            let record = data[i];
            record.type = "Text";
            record.isMerged = true;
            if (!(record.element && record.element.tag)) {
                record.element = {
                    tag: "div",
                    type: "text",
                    val: singleChild.text
                };
            }

            record.children = [];

            if (isTightText(singleChild)) {
                singleChild.style["text-align"] = "left"; // 调整紧凑文本误操作的文本对齐方式
            }

            record.text = record.value = singleChild.text;

            // 子元素传递给父元素的属性
            let styleList = [
                "color",
                "font-size",
                "font-weight",
                "line-height",
                "text-align"
            ];

            for (var key of styleList) {
                if (singleChild.style[key]) {
                    record.style[key] = singleChild.style[key];
                }
            }
            if (isAlignCenter(singleChild, record) && isTightText(singleChild)) {
                record.style["text-align"] = "center";
            }

            if (record.style["text-align"] != "center") {
                // 处理距离与左边的距离
                record.style["padding-left"] = singleChild.x - record.x;
                //设置右边距
                //单行不设置
                let paddingRight = 0;
                if (
                    record.x + record.width - singleChild.x - singleChild.width > 0 &&
                    (!singleChild.style["font-size"] ||
                        (singleChild.style["font-size"] &&
                            singleChild.style["font-size"] < 0.5 * singleChild.height))
                ) {
                    paddingRight =
                        record.x + record.width - singleChild.x - singleChild.width;
                    record.style["padding-right"] = paddingRight;
                }
                // 设置padding值，要剪掉相应的宽度
                if (/px/.test(record.style["width"])) {
                    record.style["width"] =
                        record.style["width"] - record.style["padding-left"] - paddingRight;
                }
            }

            // 处理距离与上边的距离
            singleChild.style["margin-top"] = singleChild.y - record.y;

            if (
                Math.abs(singleChild.y + singleChild.height * 0.5 - record.y - record.height * 0.5) <= 2 && // 允许上下误差 4px
                !record.text.includes("\n") &&
                record.style["font-size"]
                // record.style["font-size"] > record.height * 0.5
            ) {
                record.style['line-height'] = record.height;
                // 垂直方向上是居中的
                // if (record.style["text-align"] == "center") {
                //     delete record.style["text-align"];
                //     delete item.style['line-height']
                //     // 文本水平垂直居中
                //     record.style = {
                //         ...record.style,
                //         ...{
                //             display: "flex",
                //             "justify-content": "center",
                //             "align-items": "center"
                //         }
                //     };
                // } else {
                //     // 竖直方向上居中
                //     record.style = {
                //         ...record.style,
                //         ...{
                //             display: "flex",
                //             "align-items": "center"
                //         }
                //     };
                //     delete item.style['line-height']
                // }
            } else {
                record.style["padding-top"] = singleChild.style["margin-top"] || 0;
            }
        }
        if (item.children) {
            simplifyText(item.children);
        }
    }
    return data;
};

/**
 *
 * @param {*} data
 * @param {*} parent
 * 文本的语义化
 */
var Semanticization = (data) => {
    if (!data) return [];
    for (var i = 0; i < data.length; i++) {
        let item = data[i];
        if (item.type == "Text" && !item.children) {
            if (item.style["font-weight"] == 700 && data.length == 1) {
                // 标题
                if (item.style["font-size"] <= 16) {
                    item.element.tag = "h4";
                } else {
                    item.element.tag = "h3";
                }
            } else if (item.text.indexOf("\n") > -1) {
                // 包含换行则表示段落
                item.element.tag = "p";
            } else if (data.length >= 2 && isAllText(data) && isSameRow(data)) {
                item.element.tag = "span";
                item.style = {
                    ...item.style,
                    display: "block"
                };
            }
        }

        if (item.children) {
            Semanticization(item.children, item);
        }
    }
    return data;
};
const handleTextWidth = (
    data,
    parentWidth = "",
    parentX = "",
    type = "left"
) => {
    for (let i = 0; i < data.length; i++) {
        let record = data[i];
        let currWidth = record.width;
        if (record.type == "Text") {
            if (record.value.length > 20) {
                record.width = +record.width + 10;
            } else if (record.value.length > 10) {
                record.width = +record.width + 6;
            } else if (record.value.length > 6) {
                record.width = +record.width + 4;
            } else if (record.value.length > 1) {
                record.width = +record.width + 2;
            }
            //撤销补偿
            if (parentWidth && parentWidth + parentX < record.width + record.x) {
                record.width = currWidth;
            }
            //撤销补偿
            for (let j = 0; j < data.length; j++) {
                const currItem = data[j];
                if (
                    i != j &&
                    Math.abs(
                        currItem.x + currItem.width / 2 - record.x - record.width / 2
                    ) <
                    currItem.width / 2 + record.width / 2 &&
                    Math.abs(
                        currItem.y + currItem.height / 2 - record.y - record.height / 2
                    ) <
                    currItem.height / 2 + record.height / 2
                ) {
                    record.width = currWidth;
                }
            }
            //不同类型平移方向不同
            if (record.width !== currWidth) {
                let distance = record.width - currWidth;
                if (type == "right") {
                    record.x = record.x - distance;
                } else if (type == "center") {
                    record.x = record.x - distance / 2;
                }
            }
        }
        data[i] = record;
        if (Array.isArray(data[i].children)) {
            data[i].children = handleTextWidth(
                data[i].children,
                data[i].width,
                data[i].x
            );
        }
    }
    return data;
};
module.exports = {
    simplifyText,
    Semanticization,
    handleTextWidth
};
