import { formateDslStyle, formateDslRemStyle,formatDslRpxStyle } from './formateDslStyle'
import { transRNStyle } from './transRNStyle';
import { transAndroidCode } from './transAndroidCode';
import { transIOSCode } from './transIOSCode';
import { transFlutterCode } from './transFlutterCode';
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
    
    // 画板宽度
    // const artboardWidth = data[0].structure.width * scale;
    const scaleData = transScale(data, { scale, unit, colorFormat, codeType });

    switch (codeType) {
        case CodeType.WebPx:
            const codeData = formateDslStyle(scaleData);
            return transWebCode(data, codeData);
        case CodeType.WebRem:
            // 样式转换px
            const dataPx = formateDslStyle(scaleData);
            // 样式转换rem
            const dataRem = formateDslRemStyle(dataPx, 1);

            return transWebCode(data,dataRem);
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
        case CodeType.Flutter:

            return transFlutterCode(data);

        default:
            break;
    }
}
