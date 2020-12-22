import handleCssOrder from './handleCssOrder';
import { Layer } from '../types';
/**
 * scss中 px转换为rem方法
 * @param {String} value css值
 * @param {String} platform 平台
 */
const addpxtorem = (value: string) => {
    if (/px/.test(value)) {
        value = value.replace(/((\.|\d|\e|\-)+)px/g, ($1:any) => {
            return `pxtorem(${Math.round($1.split('px')[0] * 10)/ 10}px)`;
        });
    }

    return value;
}

const pxtorem = (currValue: string, platform: number, size: number) => {
    const draftSize = size / 7.5;

    if (/px/.test(currValue)) {
        currValue = currValue.replace(/((\.|\d|\e|\-)+)px/g, ($1: any) => {
            return + platform === 2
                ? `${Math.round(($1.split("px")[0] / draftSize) * 1000) / 1000}rem`
                : `${Math.round($1.split("px")[0] * 10) / 10}px`;
        });
    }

    return currValue;
};

// scss字符串
let scssStr = '';

const transformScssFormat = (data: Layer[], size: number, platform: number) => {
    for (var i = 0; i < data.length; i++) {
        scssStr += `.${ data[i].className } {\n`;
        let orderStyle = handleCssOrder(data[i].style);
        let styleKeyList = Object.keys(orderStyle);
        for (let j = 0; j < styleKeyList.length; j++) {
            const key = styleKeyList[j];
            let value = orderStyle[key];
            //修复undefindpx的bug
            value = pxtorem(value, platform, size);
            if (!/undefind/.test(value)) {
                scssStr += `    ${key}: ${value};\n`
            }
        }

        scssStr += `\}\n`;
        if (data[i].children) {
            transformScssFormat(data[i].children, size, platform);
        }
    }
    return scssStr;
}

const generaterScss = (data: Layer[], size: number, platform: number) => {
    // 清空存储
    scssStr = '';
    return transformScssFormat(data, size, platform);
}

export default generaterScss;
