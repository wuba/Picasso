import getString from './getString'
import getStringStyle from './getStringStyle'
import { SKLayer,Text } from '../../types';

export default (text:any,layer:SKLayer):Text => {
    if (layer._class!=='text') {
        return text;
    }
    // 设置类型
    text.type = 'Text';
    if (!text.style.textStyle) {
        text.style.textStyle = {};
    }
    text.value = getString(layer);
    let strStyleList = getStringStyle(layer);
    if (Array.isArray(strStyleList) && strStyleList.length > 0) {
        if (strStyleList[0].paragraphSpacing) {
            text.style.textStyle.paragraphSpacing = strStyleList[0].paragraphSpacing;
        }
        for (let i = 0; i < strStyleList.length; i++) {
            delete strStyleList[i].paragraphSpacing;
        }
    }

    // 默认取第一个文本样式
    const style = getStringStyle(layer)[0];
    if (style && style.pos) {
        delete style.pos;
    }
    text.style.textStyle = style || {};

    // 多段文本处理
    if (Array.isArray(strStyleList) && strStyleList.length > 1) {
        
        // TODO
        // if (!text.textStyle['lineHeight'] && text.textStyle['fontSize'] &&
        //     +text.textStyle['fontSize'] > text.height * 0.5
        // ) {
        //     text.textStyle['line-height'] = text.height;
        // }
        // text.style = {
        //     ...text.style,
        //     ...JSON.parse(JSON.stringify(text.textStyle))
        // };
        // text.type = 'Text';
        // Todo
        // if (/[a-zA-Z]+/.test(text.value) && text.style.textStyle.fontSize <= +text.structure.height * 0.5) { // 包含英文单词需要换行处理
        //     text.style.textStyle.wordBreak = 'break-all'
        // }
        // } else {
        // 处理一串字符多个样式的情况
        // TODO
        // if (layer.istransformContain) {
        //     text.istransformContain = true;
        // }
        // text.children = [];
        // text.textContainer = true;
        // if (!text.style) {
        //     text.style = {}
        // }
        // 存储多行文本。
        text.children = [];
        for (let i = 0; i < strStyleList.length; i++) {
            let strStyle = strStyleList[i]
            let tempObj:Text = {
                type: 'Text',
                value: '',
                style: {
                    textStyle: {
                        lineHeight: +text.structure.height
                    }
                },
                structure: {
                    height: text.structure.height,
                    y: text.structure.y,
                }
                // parentId: layer.do_objectID,
            };
            if (i == 0) { // 第一个元素继承父元素的左偏移量
                tempObj.structure.x = text.structure.x;
                //todo ?
                // if (strStyle['font-size'] && 0.5 * text.structure.height < strStyle['font-size']) {
                //     text.style.display = 'flex';
                // }
            }
            for (let key in strStyle) {
                if (key === 'pos') {
                    let [location, length] = strStyle[key];
                    // 标注模式
                    tempObj.value = text.value.substr(location, length);
                    // 代码模式
                    // tempObj.value = text.value.substr(location, length).replace(/ | /g, '&nbsp;');
                    // if (i == strStyleList.length - 1) {
                    //     tempObj.value = tempObj.value.replace(/(&nbsp;)+$/, '');
                    // }
                    
                    // TODO
                    // if (tempObj.value && /[a-zA-Z]+/.test(tempObj.value)) { // 包含英文单词需要换行处理
                    //     tempObj.style.textStyle.wordBreak = 'break-all';
                    // }
                    delete strStyle.pos;
                } else {
                    tempObj.style.textStyle[key] = strStyle[key];
                }
            }
            text.children.push(tempObj);
        }
    }
    return text;
}

