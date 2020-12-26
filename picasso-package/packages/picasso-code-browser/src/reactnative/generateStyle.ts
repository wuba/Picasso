/*
 * @Author: iChengbo
 * @Date: 2020-09-02 11:44:55
 * @LastEditors: iChengbo
 * @LastEditTime: 2020-12-24 15:17:23
 * @FilePath: /Picasso/picasso-package/packages/picasso-code-browser/src/reactnative/generateStyle.ts
 */
let styles = {};

export const generateRNStyle = (data: any) => {

    if (Array.isArray(data)) {
        data.forEach(item => {
            // 删除特殊处理的属性
            delete item.style.backgroundImage;
            delete item.style.linearGradient;
            delete item.style.backgroundSize;
            styles[item.className] = item.style;
            if (Array.isArray(item.children)) {
                generateRNStyle(item.children);
            }
        });
    }
    let result = JSON.stringify(styles, null, 2).replace(/"width": ((\.|\d|\e|\-)+)/g, ($, $1) => {
        return `"width": scaleSize(${$1})`;
    });
    result = result.replace(/"height": ((\.|\d|\e|\-)+)/g, ($, $1) => {
        return `"height": scaleSize(${$1})`;
    });
    result = result.replace(/"lineHeight": ((\.|\d|\e|\-)+)/g, ($, $1) => {
        return `"lineHeight": scaleSize(${$1})`;
    });
    result = result.replace(/"marginLeft": ((\.|\d|\e|\-)+)/g, ($, $1) => {
        return `"marginLeft": scaleSize(${$1})`;
    });
    result = result.replace(/"marginTop": ((\.|\d|\e|\-)+)/g, ($, $1) => {
        return `"marginTop": scaleSize(${$1})`;
    });
    result = result.replace(/"fontSize": ((\.|\d|\e|\-)+)/g, ($, $1) => {
        return `"fontSize": scaleSize(${$1})`;
    });
    return result;
}