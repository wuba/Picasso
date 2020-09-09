const dealParagraph = require('./dealParagraph')
const dealColor = require('./dealColor')
const dealFont = require('./dealFont')
const dealLetterSpacing = require('./dealLetterSpacing')
const dealTextDecorate = require('./dealTextDecorate')

module.exports = (layer) => {
    // 直接解析text字体样式有字体大小的情况下
    if (layer.attributedString.string && layer.attributedString.attributes) {
        let size = 1;
        if (layer.frame.sizeY) {
            size = layer.frame.sizeY;
        }
        let attrList = layer.attributedString.attributes;
        let strStyleList = [];
        let minFontSize = '';
        for (let attrItem of attrList) {
            if (attrItem._class == 'stringAttribute') {
                let attributes = attrItem.attributes;
                let fontStyle = attributes['MSAttributedStringFontAttribute']
                let colorStyle = attributes['MSAttributedStringColorAttribute']
                let paragraphStyleObj = attributes['paragraphStyle']
                let kerning = attributes['kerning']
                let style = {
                    ...{
                        pos: [attrItem.location, attrItem.length]
                    }, // 记录位置信息， 开始位置， 截取多少个 subStr
                    ...dealParagraph(paragraphStyleObj),
                    ...dealColor(colorStyle, layer.style),
                    ...dealFont(fontStyle, size),
                    ...dealLetterSpacing(kerning),
                    ...dealTextDecorate(attributes), // 处理文本转换
                };
                if (minFontSize == '' || minFontSize > style['font-size']) {
                    minFontSize = style['font-size']
                }
            }
        }
        let isTextBreak = false;
        if (minFontSize && minFontSize > 0.5 * layer.frame.height) {
            isTextBreak = true;
            layer.istransformContain = true;
        }
        attrList = isTextBreak ? attrList : attrList.slice(0, 1);
        for (let attrItem of attrList) {
            if (attrItem._class == 'stringAttribute') {
                let attributes = attrItem.attributes;
                let fontStyle = attributes['MSAttributedStringFontAttribute']
                let colorStyle = attributes['MSAttributedStringColorAttribute']
                let paragraphStyleObj = attributes['paragraphStyle']
                let kerning = attributes['kerning']
                let style = {
                    ...{
                        pos: [attrItem.location, attrItem.length]
                    }, // 记录位置信息， 开始位置， 截取多少个 subStr
                    ...dealParagraph(paragraphStyleObj),
                    ...dealColor(colorStyle, layer.style),
                    ...dealFont(fontStyle, size),
                    ...dealLetterSpacing(kerning),
                    ...dealTextDecorate(attributes), // 处理文本转换
                    paragraphSpacing: paragraphStyleObj ? paragraphStyleObj.paragraphSpacing : 0
                };
                strStyleList.push(style);
            }
        }
        return strStyleList;
    }

    return {};
}
