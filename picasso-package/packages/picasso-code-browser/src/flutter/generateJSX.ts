/*
 * @Author: iChengbo
 * @Date: 2020-09-02 11:41:52
 * @LastEditors: iChengbo
 * @LastEditTime: 2021-02-03 15:45:08
 * @FilePath: /Picasso/picasso-package/packages/picasso-code-browser/src/reactnative/generateJSX.ts
 */

const RN = {
    Container: 'View',
    Image: 'ImageBackground',
    Text: 'Text',
    Link: 'Text',
}

/**
 *
 *
 * @param {Array} data layoutDSL
 * @returns React代码
 */
function _generateRNJSX(data: any): any {
    let html = []
    for (let i = 0; i < data.length; i++) {
        let record = data[i]
        if (record.type == 'Image' && ((record.children && record.children.length == 0) || !record.children)) {
            const source = formatImageSource(record.value);

            html.push(
                `<Image style=${
                record.addClassName
                    ? `{StyleSheet.flatten([styles.${record.addClassName}, styles.${record.className}])}`
                    : `{styles.${record.className}}`
                } source={${source}} resizeMode={"stretch"} />`
            )
        } else {
            let tag = RN[record.type]
            if (record.type == 'Image') {
                // console.log("图片样式：", record.style)
                // 背景图片
                if (!!record.style.backgroundImage) {
                    const bgSource = formatImageSource(record.style.backgroundImage);
                    html.push(`<${tag} style={${record.addClassName ?
                        `StyleSheet.flatten([styles.${record.addClassName}, styles.${record.className}])`
                        : `styles.${record.className}`}}
                            source={${bgSource}}
                        >`
                    );
                } else if (!!record.style.linearGradient) {
                    // 渐变的处理
                    tag = 'LinearGradient';
                    const { gAngle, gList } = record.style.linearGradient;
                    const _gList = gList.map(item => {
                        // return generateColor(item.color);
                    });
                    const { width, height } = record.style.backgroundSize;
                    html.push(`<LinearGradient useAngle={true} angle={${+gAngle}} colors={${JSON.stringify(_gList)}} style={{width: scaleSize(${width / 2}), height: scaleSize(${height / 2})}}>`);
                } else {
                    tag = 'View';
                    html.push('<View>');
                }
            } else if (record.type == 'Text') {
                // 文本特殊处理：包一层View设置高度，并将文本垂直居中
                // 方案一：会导致一些其他的问题
                // tag = 'View';
                // html.push(`<${tag} style={{ height: styles.${record.className}.height, flexDirection: 'row', alignItems: 'center'  }}>`)
                // // html.push(`<${tag} style={${record.addClassName ?
                // //     `StyleSheet.flatten([styles.${record.addClassName}, styles.${record.className}, { flexDirection: 'row', alignItems: 'center' }])`
                // //     : `[styles.${record.className}, { flexDirection: 'row', alignItems: 'center' }]`}}>`);
                // html.push(`<Text style={${record.addClassName ?
                //     `StyleSheet.flatten([styles.${record.addClassName}, styles.${record.className}, { height: undefined, lineHeight: undefined }])`
                //     : `[styles.${record.className}, { height: undefined, lineHeight: undefined }]`}}>`
                // );
                // html.push(record.value.replace(/\n/g, `{"\\n"}`) || '');
                // html.push('</Text>');
                // 方案二：将高度及行高均置为 undefined，但会影响上下间距布局
                html.push(`<${tag} style={${record.addClassName ?
                    `StyleSheet.flatten([styles.${record.addClassName}, styles.${record.className}])`
                    : `[styles.${record.className}, { height: undefined, lineHeight: undefined }]`}}>`
                );
            } else {
                html.push(`<${tag} style={${record.addClassName ?
                    `StyleSheet.flatten([styles.${record.addClassName}, styles.${record.className}])`
                    : `styles.${record.className}`}}>`
                );
            }

            if (record.children && record.type != 'Text') {
                // 递归 子 children
                html.push(generateRNJSX(record.children))
            } 
            // else if (record.children && record.type == 'Text' && !record.isMerged) {
            //     // TODO：此处是干啥的
            //     html.push(record.value || '');
            //     html.push(generateRNJSX(record.children));
            // } 
            else {
                if (record.type == 'Text') {
                    html.push(record.value.replace(/\n/g, `{"\\n"}`) || '');
                }
            }
            html.push(`</${tag}>`)
        }
    }
    return html.join('\n')
}

export const generateRNJSX = (data: any) => {
    let JSXCode = _generateRNJSX(data)
    return JSXCode;
    // return beautifyHtml(JSXCode, { indent_size: 2 })
}

/**
 * 根据图片名称，格式化为 RN Image 标签 source 属性
 * @param imageName 图片名称
 */
function formatImageSource(imageName: string) {
    let imageSource = ''
    if (/^http/.test(imageName)) {
        imageSource = `{uri: "${imageName}"}`
    } else {
        imageSource = `require('./images/${imageName}')`.replace(/\@\d+x/, '')
    }
    return imageSource
}