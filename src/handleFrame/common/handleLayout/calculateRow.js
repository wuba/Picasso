/**
 * 处理最外层布局
 *
 * @param {Array} data 图层Tree
 * @returns
 */
const calculateRow = data => {
    //最外层补偿值
    if (!data.length) return;
    let minX = data[0].x;
    for (let i = 0; i < data.length; i++) {
        if (minX > data[i].x) {
            minX = data[i].x;
        }
    }
    for (let i = 0; i < data.length; i++) {
        if (data[i]._class == "artboard") {
            data[i].style["width"] = data[i].width;
            data[i].style["margin"] = `0 auto`;
            data[i].style["overflow"] = "hidden";
            if (i > 0) {
                data[i].style["margin-top"] = 0;
            }
            return [data[i]];
        } else {
            data[i].style["width"] = data[i].width;
            data[i].style["margin"] = `0 auto`;
            data[i].style["overflow"] = "hidden";
            if (i > 0) {
                data[i].style["margin-top"] = 0;
            }
        }
    }
    return data;
};
module.exports = calculateRow;
