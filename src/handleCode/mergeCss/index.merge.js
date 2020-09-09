/**
 * merge版
 */
/**
 * 获取独有样式
 * @param {Object} totalStyle 所有样式
 * @param {Object} commonStyle 公用样式
 */
const getOnlyStyle = (totalStyle, commonStyle) => {
    const onlyStyle = {};
    Object.keys(totalStyle).forEach(item => {
        if (commonStyle[item] !== totalStyle[item]) {
            onlyStyle[item] = totalStyle[item];
        }
    });
    return onlyStyle;
}
/**
 * 获取多个图层的公用样式
 * @param {Array} arr 共有样式的图层项
 */
const mergeCommonStyle = (arr) => {
    let keySet = [];
    arr.forEach(item => {
        keySet = keySet.concat(Object.keys(item.style));
    })
    keySet = [...new Set(keySet)];
    const commonStyle = {};
    keySet.forEach(item => {
        let flag = true;
        const valObj = {};
        let count = 0;
        let commonVal = '';
        arr.forEach(ite => {
            if (ite.style[item] === undefined) {
                flag = false;
            } else {
                if (valObj[ite.style[item]] === undefined) {
                    valObj[ite.style[item]] = 1;
                } else {
                    valObj[ite.style[item]] += 1;
                }
                if (valObj[ite.style[item]] && valObj[ite.style[item]] > count) {
                    count = valObj[ite.style[item]];
                    commonVal = ite.style[item];
                }
            }
        });
        if (flag && commonVal !== '') {
            commonStyle[item] = commonVal;
        }
    });
    return commonStyle;
}

/**
 * 处理list中item第一层
 * 1.列表嵌套列表
 * 2.列表不嵌套列表
 */
const handleItemChild = (list) => {
    if (!Array.isArray(list) || list.length === 0) {
        return list;
    }
    const firstItem = list[0];
    if (Array.isArray(firstItem.children)) {
        let flag = true;
        list.forEach(item => {
            if (item.children === undefined) {
                flag = false;
            } else if (item.children.length !== firstItem.children.length) {
                flag = false;
            }
        });
        if (!flag) {
            return list;
        }
        // 第一层
        firstItem.children.forEach((item, index) => {
            const itemArr = [];
            list.forEach(ite => {
                itemArr.push(ite.children[index]);
            })
            const commonStyle = mergeCommonStyle(itemArr);
            const classObj = {};
            list.forEach((ite, ind) => {
                if (ind === 0) {
                    ite.children[index].commonStyle = commonStyle;
                } else {
                    ite.children[index].commonStyle = {};
                }
                const currOnlyStyle = getOnlyStyle(ite.children[index].style, commonStyle);
                ite.children[index].onlyStyle = currOnlyStyle;
                ite.children[index].className = list[0].children[index].className;
                if (Object.keys(currOnlyStyle).length > 0) {
                    if (classObj[JSON.stringify(currOnlyStyle)] === undefined) {
                        //独有className
                        ite.children[index].subClassName = `subli${ind}`;
                        classObj[JSON.stringify(currOnlyStyle)] = `subli${ind}`;
                    } else {
                        ite.children[index].subClassName = classObj[JSON.stringify(currOnlyStyle)];
                        ite.children[index].onlyStyle = {};
                    }
                }
            })
        })
        return list;
    } else {
        return list;
    }
}

/**
 * 合并样式
 */
const mergeCss = (data) => {
    try {
        const itemSet = new Set();
        let flag = true;
        data.forEach(item => {
            if (item.className && /\-li$/.test(item.className)) {
                itemSet.add(item.className);
            } else {
                flag = false;
            }
        });
        const itemArr = [...itemSet];
        itemArr.forEach(item => {
            let IndexArr = [];
            data.forEach((ite, index) => {
                if (ite.className === item) {
                    IndexArr.push({ index, style: ite.style });
                }
            });
            const commonStyle = mergeCommonStyle(IndexArr);
            const classObj = {};
            IndexArr.forEach((ite, ind) => {
                if (ind === 0) {
                    data[ite.index].commonStyle = commonStyle;
                } else {
                    data[ite.index].commonStyle = {};
                }
                const currOnlyStyle = getOnlyStyle(data[ite.index].style, commonStyle);
                data[ite.index].onlyStyle = currOnlyStyle;
                if (Object.keys(currOnlyStyle).length > 0) {
                    if (classObj[JSON.stringify(currOnlyStyle)] === undefined) {
                        //独有className
                        data[ite.index].subClassName = `li${ite.index}`;
                        classObj[JSON.stringify(currOnlyStyle)] = `li${ite.index}`;
                    } else {
                        data[ite.index].subClassName = classObj[JSON.stringify(currOnlyStyle)];
                        data[ite.index].onlyStyle = {};
                    }
                }
            })
        })
        if (flag) {
            data = handleItemChild(data);
        }
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            if (Array.isArray(item.children)) {
                item.children = mergeCss(item.children);
            }
        }
        return data;
    } catch (error) {
        console.log(error);
    }

}
module.exports = mergeCss;
