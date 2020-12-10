import { isSingleText,isCenter } from './handleTypeLayout';
import { Layer } from './types';

/**
 * 全部为块元素的竖直方向布局
 *
 * @param {*} data
 * @param {*} parent
 * @returns
 */
const calculateBlock = (data: Layer[], parent: Layer) => {

    data = data.sort((a, b) => a.structure.y - b.structure.y);
    //边框处理
    const pBorderWidth = parent.structure?.border?.top?.width || 0;
    for (let i = 0; i < data.length; i++) {
        if (!data[i].style) {
            data[i].style = {};
        }
        data[i].style.width = data[i].structure.width;

        if (isCenter(data[i], parent)) {
            data[i].isCenter = true;
        }
        if (isSingleText(data[i]) && data[i].style.textAlign === 'left') {
           delete data[i].style.width;
        }
        const marginLeft = data[i].structure.x - parent.structure.x - pBorderWidth;

        if (marginLeft) {
            data[i].style.marginLeft = marginLeft;
        }
        //假设所有单行文本都是填满的
        if (isSingleText(data[i]) &&
            Math.abs(parent.structure.x + parent.structure.width * 0.5 - (data[i].structure.x + data[i].structure.width * 0.5)) < 3
        ) {
            data[i].style.textAlign = 'center';
            delete data[i].style.width;
            delete data[i].style.marginLeft;
            //去掉 子元素宽度与父元素相同时情况 
        } else if (!isSingleText(data[i]) && Math.abs(parent.structure.x + parent.structure.width * 0.5 - (data[i].structure.x + data[i].structure.width * 0.5)) < 3 && parent.structure.width != data[i].structure.width) {
            if (data[i].style.display === 'flex' && data[i].textContainer) { //单行多样式文本的处理
                data[i].style.justifyContent = 'center';
                delete data[i].style.width;
                delete data[i].style.marginLeft;
                delete data[i].style.marginRight;
            }
        }

        if (i > 0) {
            let marginTop = data[i].structure.y - (data[i - 1].structure.y + data[i - 1].structure.height)
            if (marginTop) {
                data[i].style.marginTop = marginTop;
            }
        } else {
            let pBorderTop = parent.structure.border?.top?.width || 0;
            let paddingTop = data[i].structure.y - parent.structure.y - pBorderWidth - pBorderTop
            if (paddingTop) {
                data[i].style.marginTop = paddingTop;
                parent.style.paddingTop = 0.1;
            }
        }
    }
    return data;
}

export default calculateBlock;
