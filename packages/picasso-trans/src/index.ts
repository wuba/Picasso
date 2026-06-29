// import * as fs from 'fs'
import { formateDslStyle, formateDslRemStyle,formatDslRpxStyle } from './formateDslStyle'
import { transRNStyle } from './transRNStyle';
import { transAndroidCode } from './transAndroidCode';
import { transIOSCode } from './transIOSCode';
import { transWebCode } from './transWebCode';
import { transPanel } from './transPanel';
import { transScale } from './transScale';

import { Layer, PanelOptions, WebScale, Unit, ColorFormat, CodeType } from './types';

export * from './codeTrans';
export * from './colorTrans';

/**
 *
 * @param {Array} data DSL
 * @param {Number} remScale rem换算参数
 * @returns 处理后的DSL样式
 */
export const picassoTrans = (data: Layer[], {
    scale = WebScale.Points,
    unit = Unit.WebPx,
    colorFormat = ColorFormat.RGBA,
    codeType = CodeType.WebPx,
}: PanelOptions) => {
    // 属性面板处理
    data = transPanel(data, { scale, unit, colorFormat, codeType });
    // fs.writeFileSync('./test/transPanel_code_dsl.json', JSON.stringify(data, null,2));
    
    // 画板宽度
    // const artboardWidth = data[0].structure.width * scale;
    const scaleData = transScale(data, { scale, unit, colorFormat, codeType });

    // fs.writeFileSync('./test/scaleData_code_dsl.json', JSON.stringify(scaleData, null,2));

    switch (codeType) {
        case CodeType.WebPx:
            const codeData = formateDslStyle(scaleData);
            // fs.writeFileSync('./test/web_code_dsl_10.json', JSON.stringify(codeData, null,2));

            const webCodeData = transWebCode(data, codeData);
            // fs.writeFileSync('./test/web_code_dsl_11.json', JSON.stringify(webCodeData, null,2));

            return webCodeData
            // return transWebCode(data, codeData)
        case CodeType.WebRem:
            // 样式转换px
            const dataPx = formateDslStyle(scaleData);
            // fs.writeFileSync('./test/web_code_dsl_12.json', JSON.stringify(dataPx, null,2));

            // 样式转换rem
            const dataRem = formateDslRemStyle(dataPx, 1);
            // fs.writeFileSync('./test/web_code_dsl_13.json', JSON.stringify(dataRem, null,2));

            const remCodeData = transWebCode(data,dataRem);
            // fs.writeFileSync('./test/web_code_dsl_14.json', JSON.stringify(remCodeData, null,2));

            return remCodeData;
        case CodeType.Weapp:

            // 样式转换px
            const dataweappPx = formateDslStyle(scaleData);
            // 样式转换rpx
            const dataRpx = formatDslRpxStyle(dataweappPx, 1);

            return transWebCode(data,dataRpx);
        case CodeType.ReactNative:

            const codeRNData = transRNStyle(scaleData);
            return transWebCode(data,codeRNData);
        case CodeType.IOS:

            return transIOSCode(data);
        case CodeType.Android:

            return transAndroidCode(data);

        default:
            break;
    }
}
