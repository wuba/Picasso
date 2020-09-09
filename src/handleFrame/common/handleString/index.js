const getString = require('./getString')
const getStringStyle = require('./getStringStyle')

module.exports = (layer, record) => {
    // 标记文本元素
    record.text = getString(layer);
    let strStyleList = getStringStyle(layer);
    if (Array.isArray(strStyleList) && strStyleList.length > 0) {
        if (strStyleList[0].paragraphSpacing) {
            record.paragraphSpacing = strStyleList[0].paragraphSpacing;
        }
        for (let i = 0; i < strStyleList.length; i++) {
            delete strStyleList[i].paragraphSpacing;
        }
    }

    if (!Array.isArray(strStyleList) || strStyleList.length == 1) {
        if (Array.isArray(strStyleList)) {
            record.textStyle = getStringStyle(layer)[0];
            if (record.textStyle.pos) { // 删除 pos 属性
                delete record.textStyle.pos
            }
        } else {
            record.textStyle = getStringStyle(layer);
        }
        record.element = {
            type: 'text',
            val: '',
            tag: 'div'
        }
        if (!record.textStyle['line-height'] && record.textStyle['font-size'] &&
            +record.textStyle['font-size'] > record.height * 0.5
        ) {
            record.textStyle['line-height'] = record.height;
        }
        record.style = {
            ...record.style,
            ...JSON.parse(JSON.stringify(record.textStyle))
        };
        record.type = 'Text';
        if (record.text && /[a-zA-Z]+/.test(record.text) && record.textStyle['font-size'] <= record.height * 0.5) { // 包含英文单词需要换行处理
            record.style['word-break'] = 'break-all'
        }
        record.value = record.val = record.text;
    } else {
        // 处理一串字符多个样式的情况
        if (layer.istransformContain) {
            record.istransformContain = true;
        }
        record.children = [];
        record.textContainer = true;
        if (!record.style) {
            record.style = {}
        }


        for (let i = 0; i < strStyleList.length; i++) {
            let strStyle = strStyleList[i]
            let tempObj = {
                type: "Text",
                style: {
                    "line-height": record.height
                },
                height: record.height,
                y: record.y,
                element: { tag: "span" },
                parentId: layer.do_objectID
            };
            if (i == 0) { // 第一个元素继承父元素的左偏移量
                tempObj.x = record.x;
                //todo ?
                if (strStyle['font-size'] && 0.5 * record.height < strStyle['font-size']) {
                    record.style['display'] = 'flex';
                }
            }
            for (let key in strStyle) {
                if (key == 'pos') {
                    let [location, length] = strStyle[key];

                    tempObj.text = tempObj.value = record.text.substr(location, length).replace(/ | /g, "&nbsp;");
                    if (i == strStyleList.length - 1) {
                        tempObj.text = tempObj.text.replace(/(&nbsp;)+$/, '');
                        tempObj.value = tempObj.text;
                    }
                    if (tempObj.text && /[a-zA-Z]+/.test(tempObj.text)) { // 包含英文单词需要换行处理
                        tempObj.style['word-break'] = 'break-all'
                    }
                    delete strStyle.pos;
                } else {
                    tempObj.style[key] = strStyle[key];
                }
            }
            record.children.push(tempObj);
        }
    }
    return record;
}

