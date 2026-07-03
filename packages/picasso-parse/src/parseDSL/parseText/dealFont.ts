/**
 * 获取字体大小, 文字字体, 字体粗细
 */
import getFontWeight from './getFontWeight';
import { SKFontDescriptor,TextStyle } from '../../types';

export default (fontStyle:SKFontDescriptor, size = 1): TextStyle => ({
    fontSize: fontStyle.attributes?.size * size,
    fontFamily: fontStyle.attributes?.name?.replace(/PingFang-SC|PingFang SC/,'PingFangSC'), // 1.PingFang-SCPingFang SC 针对PingFang-SC和PingFang SC在web端不生效的问题，进行修正处理
    fontWeight: getFontWeight(fontStyle.attributes?.name)
});
