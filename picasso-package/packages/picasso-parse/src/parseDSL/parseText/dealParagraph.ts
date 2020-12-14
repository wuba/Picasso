
import { SKParagraphStyle,TextStyle, SKFontDescriptor } from '../../types';
import { fontSizeLineHeightMap } from '../../common/const';
/**
 * 处理段落
 */
export default (paragraphStyle:SKParagraphStyle, fontStyle: SKFontDescriptor, size=1):TextStyle => {
    const textStyle:TextStyle = {};

    if (paragraphStyle) {
        switch (paragraphStyle.alignment) {
            case 2:
                textStyle.textAlign = 'center';
                break;
            case 1:
                textStyle.textAlign = 'right';
                break;
            case 0:
                textStyle.textAlign = 'left';
                break;
            case 3: //两边对齐
                textStyle.textAlign = 'justify';
                break;
        }
        
        textStyle.lineHeight = paragraphStyle.maximumLineHeight ? paragraphStyle.maximumLineHeight: fontSizeLineHeightMap[fontStyle.attributes?.size * size];
    }

    return textStyle;
}
