import order from "./cssOrder";

/**
 * margin合并
 * @param {Object} styleOrderObj 样式
 */
const mergeMargin = (styleOrderObj: any) => {
    let marginTop = 0, marginRight = 0, marginBottom = 0, marginLeft = 0;
    let num = 0;
    if (styleOrderObj['margin-top']) {
        num++;
        marginTop = styleOrderObj['margin-top'];
    }
    if (styleOrderObj['margin-right']) {
        num++;
        marginRight = styleOrderObj['margin-right'];
    }
    if (styleOrderObj['margin-bottom']) {
        num++;
        marginBottom = styleOrderObj['margin-bottom'];
    }
    if (styleOrderObj['margin-left']) {
        num++;
        marginLeft = styleOrderObj['margin-left'];
    }
    if (num >= 2) {
        if (marginBottom == marginLeft && marginLeft == marginRight && marginRight == marginTop) {
            styleOrderObj['margin'] = `${marginTop}`;
        } else if (marginBottom == marginTop && marginLeft == marginRight) {
            styleOrderObj['margin'] = `${marginTop} ${marginRight}`;
        } else if (marginLeft == marginRight) {
            styleOrderObj['margin'] = `${marginTop} ${marginRight} ${marginBottom}`;
        } else {
            styleOrderObj['margin'] = `${marginTop} ${marginRight} ${marginBottom} ${marginLeft}`;
        }
        delete styleOrderObj['margin-top'];
        delete styleOrderObj['margin-right'];
        delete styleOrderObj['margin-bottom'];
        delete styleOrderObj['margin-left'];
    }
    if (styleOrderObj['margin-right']=='auto') {
        delete styleOrderObj['margin-right'];
    }
    if (styleOrderObj['margin-left']=='auto') {
        delete styleOrderObj['margin-left'];
    }
    return styleOrderObj;
}

/**
 * css 格式化
 */
export default (styleObj:any) => {
    if (styleObj instanceof Object && Object.keys(styleObj).length > 0) {
        let styleKeysList = Object.keys(styleObj);
        let styleOrderObj = {};

        for (let i = 0; i < styleKeysList.length; i++) {
            if ((styleObj[styleKeysList[i]] / 1 != 0) || styleKeysList[i]==='left' || styleKeysList[i]==='top') {
                    if (!((styleKeysList[i] == 'width' && styleObj[styleKeysList[i]] == 'auto')||
                    (styleKeysList[i] == 'font-weight' && styleObj[styleKeysList[i]] == 400)||
                    (styleKeysList[i] == 'flex-direction' && styleObj[styleKeysList[i]] == 'row')||
                    (styleKeysList[i] == 'text-align' && styleObj[styleKeysList[i]] == 'left'))
                ) {
                    if (!isNaN(styleObj[styleKeysList[i]] / 1) && 'font-weight' != styleKeysList[i] && 'flex' != styleKeysList[i]) {
                        styleOrderObj[styleKeysList[i]] = styleObj[styleKeysList[i]] + 'px';
                    } else {
                        styleOrderObj[styleKeysList[i]] = styleObj[styleKeysList[i]]
                    }
                }
            }
        }

        // 合并margin
        styleOrderObj = mergeMargin(styleOrderObj);

        // 生成的样式排序
        let styleKeysList2 = Object.keys(styleOrderObj);
        styleKeysList2.sort((a, b) => {
            return order(a) - order(b);
        });

        let styleOrderObj2 = {};
        for (let i = 0; i < styleKeysList2.length; i++) {
            styleOrderObj2[styleKeysList2[i]] = styleOrderObj[styleKeysList2[i]];
        }

        return styleOrderObj2;
    } else {
        return {};
    }
};
