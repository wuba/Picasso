import { SKLayer, TypeFace } from '../types';
import { transSketchColor } from '../common/utils';
import { fontSizeLineHeightMap, fontWeightTypes } from '../common/const';

/**
 * 基础属性解析
 * @param layer 
 */
export const parseTypeFace = (layer:SKLayer): TypeFace[] => {
    const { attributedString, style } = layer;
    if (!attributedString) {
        return [];
    }
    const {
        string: textContent, // 文本内容
        attributes // 分段样式
    }  = attributedString;

    // 分段处理
    const typefaces: TypeFace[] = attributes.map(({location,length,attributes}) => {
        let {
            name: fontFamily, // 获取字体类型
            size: fontSize, // 获取字体大小
        } = attributes.MSAttributedStringFontAttribute?.attributes;
        /**
         * fontFamily处理
         * 1.PingFang-SCPingFang SC 针对PingFang-SC和PingFang SC在web端不生效的问题，进行修正处理
         * 
         */
        fontFamily = fontFamily ? fontFamily.replace(/PingFang-SC|PingFang SC/,'PingFangSC') : '';
        // 获取字体重量, 默认 Regular;
        const val = fontFamily.split('-').pop();
        const fontWeight = fontFamily.split('-').length >= 2 && fontWeightTypes.includes(val.toLowerCase()) ? val : '';
        // 获取字体颜色 默认：{ red: 0, green: 0,blue: 0,alpha: 1 }
        const { red,green,blue,alpha } = attributes.MSAttributedStringColorAttribute || { red: 0, green: 0, blue: 0, alpha: 1, _class: 'color' };
        const color = transSketchColor({ red,green,blue,alpha });
        // 获取字间距
        const letterSpacing = attributes.kerning || 0;

        /**
         * 获取行间距
         * 1. maximumLineHeight存在，则取maximumLineHeight值
         * 2. maximumLineHeight不存在，则根据字体映射出对应的默认行高
         */
        const lineHeight = attributes.paragraphStyle?.maximumLineHeight ? attributes.paragraphStyle?.maximumLineHeight: fontSizeLineHeightMap[fontSize];
        // 获取段间距
        const paragraphSpacing = attributes.paragraphStyle?.paragraphSpacing || 0;

        /**
         * 获取字体水平居中方式
         * 0 水平左对齐
         * 1 水平居中对齐
         * 2 水平右对齐
         * 3 水平两端对齐
         */
        const alignment = attributes.paragraphStyle?.alignment !== undefined ? + attributes.paragraphStyle?.alignment : 0;

        /**
         * 获取字体垂直居中方式
         * 0 垂直顶部对齐
         * 1 垂直居中对齐
         * 2 垂直底部对齐
         */
        const verticalAlignment = + style.textStyle?.verticalAlignment;
        // 获取该段文本内容
        const content = textContent.substr(location, length);

        return {
            fontFamily,
            fontWeight,
            alignment,
            verticalAlignment,
            color,
            fontSize,
            letterSpacing,
            lineHeight,
            paragraphSpacing,
            content
        }
    });

    return typefaces;
};
