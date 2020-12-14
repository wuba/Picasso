import { SKAttributes,TextStyle } from '../../types';


/**
 * 处理文字转换问题
 */
export default (attributes:SKAttributes):TextStyle => {
    const textStyle:TextStyle = {};

    // 文字大小写转换
    if (attributes.MSAttributedStringTextTransformAttribute == 1) {
        textStyle.textTransform = 'uppercase';
    } else if (attributes.MSAttributedStringTextTransformAttribute == 2) {
        textStyle.textTransform = 'lowercase';
    }

    if (attributes.underlineStyle == 1) {
        textStyle.textDecoration = 'underline';
    }

    if (attributes.strikethroughStyle == 1) {
        textStyle.textDecoration = 'line-through';
    }

    return textStyle;
}
