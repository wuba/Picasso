

// 处理text阴影
const formatTextShadowPxToRem = (styleVal:any, remScale:any) => {
    let styleValArr = styleVal.split('px');
    const tailArr= styleValArr.splice(4, styleValArr.length - 4)
    styleValArr = styleValArr.map(item => {
        return `${Math.round(+item.split('px')[0] * 100 / remScale) /100 }rem`
    })
    styleValArr = styleValArr.concat(tailArr);
    return styleValArr.join(' ');
}

// 处理box阴影
const formatBoxShadowPxToRem = (styleVal:any, remScale:any) => {
    let styleValArr = styleVal.split(' ');

    styleValArr = styleValArr.map(item => {
        if (item.endsWith('px')) {
            return `${Math.round(+item.split('px')[0] * 100 / remScale) /100 }rem`
        }

        return item;
    })

    return styleValArr.join(' ');
}

// 处理背景
const formatBGPxToRem = (styleVal: any, remScale: any) => {
    let styleValArr = styleVal.split(' ');
    styleValArr = styleValArr.map(item => {
        return `${Math.round(+item.split('px')[0] * 100 / remScale) /100 }rem`
    })
    return styleValArr.join(' ');
}

// 渐变背景处理
const formatBGradientPxToRem = (styleVal: any, remScale: any) => {
    let stylePxArr = styleVal.split(',');
    const tailArr= stylePxArr.splice(1, stylePxArr.length - 1)
    stylePxArr = stylePxArr[0].split('(')[1];
    stylePxArr = stylePxArr.split(' ');
    stylePxArr = stylePxArr.map(item => {
        if (item.includes('px')) {
            return `${Math.round(+item.split('px')[0] * 100 / remScale) /100 }rem`
        }
        return item
    })

    stylePxArr[0]= `radial-gradient(${stylePxArr[0]}`

    const styleRemArr = [stylePxArr.join(' ')];
    const styleValArr = styleRemArr.concat(tailArr)
    // styleValArr = styleValArr.map(itemFirst => {
    //     if (itemFirst.includes('px')) {
    //         const splitStyle = itemFirst.split(' ');
    //         itemFirst = splitStyle.map(itemSecond => {
    //             if (itemSecond.includes('px')) {
    //                 return `${Math.round(+itemSecond.split('px')[0] * 100 / remScale) /100 }rem`
    //             }
    //             return itemSecond
    //         })
    //     }
    //     return itemFirst
    // })
    return styleValArr.join(',')
}

export const dslPxtoRem = (styleObj: any, remScale: any) => {
    for (let styleKey in styleObj) {
        let styleVal = styleObj[styleKey];
        // if (styleKey !== 'font-weight') {
        //     if (typeof (styleObj[styleKey]) === 'number') {
        //         const styleObjItem = `${Number(styleObj[styleKey]) * this.scaleNum}${this.tag}`;
        //         styleObj[styleKey] = styleObjItem;
        //     }
        // }
        if (typeof styleVal == 'string' && styleVal.includes('px')) {
            // 常规处理
            if (
                styleKey == 'width' ||
                styleKey == 'height' ||
                styleKey == 'line-height' ||
                styleKey == 'font-size' ||
                styleKey == 'text-indent' ||
                styleKey == 'left' ||
                styleKey == 'right' ||
                styleKey == 'top' ||
                styleKey == 'bottom'
            ) {
                styleVal = `${Math.round(+styleVal.split('px')[0] * 100 / remScale) / 100}rem`
            }
            // margin、padding
            if (
                styleKey.includes('margin')  ||
                styleKey.includes('padding')
            ) {
                const styleValArr = styleVal.split(' ');
                const styleValList = [];
                styleValArr.forEach((item: any) => {
                    styleValList.push(`${Math.round(+item.split('px')[0] * 100 / remScale) / 100}rem`)
                });
                styleVal = styleValList.join(' ')
            }
            // 边框
            if (
                styleKey.includes('border')
            ) {
                const styleValArr = styleVal.split(' ');
                styleValArr[0] = `${Math.round(+styleValArr[0].split('px')[0] * 100 / remScale) / 100}rem`
                styleVal = styleValArr.join(' ')
            }
            // 背景 position、size
            if (
                styleKey.includes('background-') 
            ) {
                styleVal = formatBGPxToRem(styleVal, remScale);
            }
            // 背景 radial-gradient
            if (
                styleKey == 'background'
            ) {
                styleVal = formatBGradientPxToRem(styleVal, remScale);
            }
            // 文字阴影
            if (
                styleKey.includes('text-shadow')
            ) {
                styleVal = formatTextShadowPxToRem(styleVal, remScale);
            }
            // 边框阴影
            if (
                styleKey.includes('box-shadow') ||
                styleKey.includes('text-shadow')
            ) {
                styleVal = formatBoxShadowPxToRem(styleVal, remScale);
            }
        }
        styleObj[styleKey] = styleVal;
    }
    return styleObj
}
