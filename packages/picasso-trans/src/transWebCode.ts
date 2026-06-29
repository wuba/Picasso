import { Layer } from './types';

export const transWebCode = (data: Layer[],codeData: Layer[]) => {
    for (let i = 0; i < data.length; i++) {
        // let code = '';
        // Object.keys(codeData[i].style).forEach(item=> {
        //     code += `${item}: ${codeData[i].style[item]};\r\n`;
        // })
        if (!data[i].panelData) {
            data[i].panelData = {};
        }
        // 属性面板兼容
        data[i].panelData.code = codeData[i].style;
        // 样式复值
        data[i].style = codeData[i].style;
        if (Array.isArray(data[i].children)) {
            transWebCode(data[i].children,codeData[i].children);
        }
    }
    return data;
}
