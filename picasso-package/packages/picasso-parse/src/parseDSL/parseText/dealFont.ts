/**
 * 获取字体大小, 文字字体, 字体粗细
 */
import getFontWeight from './getFontWeight';
import { SKFontDescriptor,TextStyle } from '../../types';

export default (fontStyle:SKFontDescriptor, size = 1): TextStyle => ({
    fontSize: fontStyle.attributes?.size * size,
    fontFamily: fontStyle.attributes?.name,
    fontWeight: getFontWeight(fontStyle.attributes?.name)
});
