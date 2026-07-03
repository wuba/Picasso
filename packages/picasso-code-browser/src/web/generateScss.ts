import handleCssOrder from './handleCssOrder';
import { Layer } from '../types';
import { getSize } from './utils';
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
// scss字符串
let scssStr = '';

const transformScssFormat = (data: Layer[],layerNumber=1) => {
    let styleTab = '';
    let classTab = '';
    let count = 0;
    while (count < layerNumber) {
        styleTab += '    '
        if (count < layerNumber - 1) {
            classTab += '    '
        }
        count++;
    }
    for (var i = 0; i < data.length; i++) {
        scssStr += layerNumber == 1 ? `.${ data[i].className } {\n${ styleTab }` : `${ classTab }.${ data[i].className } {\n${ styleTab }`;
        let orderStyle = handleCssOrder(data[i].style);
        let styleKeyList = Object.keys(orderStyle);
        for (let j = 0; j < styleKeyList.length; j++) {
            const key = styleKeyList[j];
            let value = orderStyle[key];
            //修复undefindpx的bug
            value = addpxtorem(value);
            if (!/undefind/.test(value)) {
                if (j != styleKeyList.length - 1) {
                    scssStr += `${key}: ${value};\n${styleTab}`
                } else {
                    scssStr += `${key}: ${value};\n`
                }
            }
        }
        if (data[i].children) {
            transformScssFormat(data[i].children, layerNumber + 1)
        }
        scssStr += layerNumber == 1 ? `\}\n` : `${classTab}\}\n`
        
    }
    return scssStr;
}

const generaterScss = (data: Layer[], size: number) => {
    const draftSize = size / 7.5;
    // scss 基础变量
    let scss = `@function pxtorem($px){
    @return $px/${draftSize}px * 1rem;
}
`;

    // 重新清零，防止不同画板的scss累加
    scssStr = '';
    scss += transformScssFormat(data);
    return scss;
}

export default generaterScss;
