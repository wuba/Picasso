import dealParagraph from './dealParagraph'
import dealColor from './dealColor'
import dealFont from './dealFont'
import dealLetterSpacing from './dealLetterSpacing'
import dealTextDecorate from './dealTextDecorate'
import {SKLayer,TextStyle,SKParagraphStyle } from '../../types';

// :todo 结合 parseTypeFace
export default (layer:SKLayer):any[] => {
    // 直接解析text字体样式有字体大小的情况下
    if (layer.attributedString&&layer.attributedString.string && layer.attributedString.attributes) {
        let size = 1;
        // TODO
        // if (layer.frame.sizeY) {
        //     size = layer.frame.sizeY;
        // }
        let attrList = layer.attributedString.attributes;
        let strStyleList = [];
        let minFontSize:number = 0;
        for (let attrItem of attrList) {
            if (attrItem._class == 'stringAttribute') {
                let attributes = attrItem.attributes;
                let fontStyle = attributes['MSAttributedStringFontAttribute']
                let colorStyle = attributes['MSAttributedStringColorAttribute'] || { red: 0, green: 0, blue: 0, alpha: 1, _class: 'color' };
                let paragraphStyleObj = attributes['paragraphStyle']
                let kerning = attributes['kerning']
                const textStyle:TextStyle = {
                    ...dealParagraph(paragraphStyleObj, fontStyle, size),
                    ...dealColor(colorStyle, layer),
                    ...dealFont(fontStyle, size),
                    ...dealLetterSpacing(kerning),
                    ...dealTextDecorate(attributes), // 处理文本转换
                };
                
                if ( minFontSize > textStyle.fontSize) {
                    minFontSize = textStyle.fontSize
                }
            }
        }
        let isTextBreak:boolean = false;
        if (minFontSize && minFontSize > 0.5 * layer.frame.height) {
            // 单行文字的情况
            isTextBreak = true;
            // TODO
            // layer.istransformContain = true;
        }
        // attrList = isTextBreak ? attrList : attrList.slice(0, 1);
        for (let attrItem of attrList) {
            if (attrItem._class == 'stringAttribute') {
                let attributes = attrItem.attributes;
                let fontStyle = attributes['MSAttributedStringFontAttribute']
                let colorStyle = attributes['MSAttributedStringColorAttribute'] || { red: 0, green: 0, blue: 0, alpha: 1, _class: 'color' }
                let paragraphStyleObj:SKParagraphStyle = attributes['paragraphStyle']
                let kerning = attributes['kerning']
                const style = {
                    pos: [attrItem.location, attrItem.length],// 记录位置信息， 开始位置， 截取多少个 subStr
                    ...dealParagraph(paragraphStyleObj, fontStyle, size),
                    ...dealColor(colorStyle, layer),
                    ...dealFont(fontStyle, size),
                    ...dealLetterSpacing(kerning),
                    ...dealTextDecorate(attributes), // 处理文本转换
                }
                strStyleList.push(style);
            }
        }
        return strStyleList;
    }

    return [];
}
