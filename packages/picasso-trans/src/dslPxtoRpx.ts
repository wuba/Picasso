//处理背景
const formarBGPxToRpx = (styleVal: any, scale: number) => {
    // const scale = 750 / size;
    let styleValArr = styleVal.split(' ');
    styleValArr = styleValArr.map(item => {
        return `${Math.round(+item.split('px')[0] * scale * 10) / 10}rpx`;
    })
    return styleValArr.join(' ');
}

//处理径向渐变
const formarBGradientPxToRpx = (styleVal: any, scale: number) => {
    // const scale = 750 / size;
    let stylePxArr = styleVal.split(',');
    const tailArr= stylePxArr.splice(1, stylePxArr.length - 1)
    stylePxArr = stylePxArr[0].split('(')[1];
    stylePxArr = stylePxArr.split(' ');
    stylePxArr = stylePxArr.map(item => {
        if (item.includes('px')) {
            return `${Math.round(+item.split('px')[0] * scale * 10) / 10}rpx`;
        }
        return item
    })
    stylePxArr[0]= `radial-gradient(${stylePxArr[0]}`
    const styleValArr = stylePxArr.concat(tailArr)
    return styleValArr.join(',')
}
//处理阴影
const formatShadowPxToRpx = (styleVal:any, scale: number) => {
    // const scale = 750 / size;
    let styleValArr = styleVal.split('px');
    const tailArr= styleValArr.splice(4, styleValArr.length - 4)
    styleValArr = styleValArr.map(item => {
        return `${Math.round(+item.split('px')[0] * scale * 10) / 10}rpx`
    })
    styleValArr = styleValArr.concat(tailArr);
    return styleValArr.join(' ');
}

export const dslPxtoRpx = (styleObj: any, scale: number) => {
    // const scale = 750 / size;

    for (let styleKey in styleObj) {
        let styleVal = styleObj[styleKey];
        if (styleKey !== 'font-weight') {
            if (typeof (styleObj[styleKey]) === 'number') {
                // const styleObjItem = `${Number(styleObj[styleKey]) * this.scaleNum}${this.tag}`;
                const styleObjItem = `${Number(styleObj[styleKey])}`;

                styleObj[styleKey] = styleObjItem;
            }
        }
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
                styleVal = `${Math.round(+styleVal.split('px')[0] * 10 * scale) / 10}rpx`
            }
            // margin、padding
            if (
                styleKey.includes('margin')  ||
                styleKey.includes('padding')
            ) {
                const styleValArr = styleVal.split(' ');
                const styleValList = [];
                styleValArr.forEach((item: any) => {
                    styleValList.push(`${Math.round(+item.split('px')[0] * scale * 10) / 10}rpx`)
                });
                styleVal = styleValList.join(' ')
            }
            // 边框
            if (
                styleKey.includes('border')
            ) {
                const styleValArr = styleVal.split(' ');
                styleValArr[0] = `${Math.round(+styleValArr[0].split('px')[0] * scale * 10) / 10}rpx`
                styleVal = styleValArr.join(' ')
            }
            // 背景 position、size
            if (
                styleKey.includes('background-') 
            ) {
                styleVal = formarBGPxToRpx(styleVal, scale);
            }
            // 径向渐变 radial-gradient
            if (
                styleKey == 'background'
            ) {
                styleVal = formarBGradientPxToRpx(styleVal, scale)
            }
            // 边框阴影、文字阴影
            if (
                styleKey.includes('box-shadow') ||
                styleKey.includes('text-shadow')
            ) {
                styleVal = formatShadowPxToRpx(styleVal, scale);
            }
        }
        styleObj[styleKey] = styleVal;
    }
    return styleObj
}
