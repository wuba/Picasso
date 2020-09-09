
const {
    PLATFORM,
    PAGE_TYPE,
} = require('../common/global');
const handleCssOrder = require('./handleCssOrder');
/**
 * px转换为rem方法
 * @param {String} value css值
 * @param {String} platform 平台
 */
const addpxtorem = (value, platform) => {
    if (/px/.test(value)) {
        value = value.replace(/((\.|\d|\e|\-)+)px/g, ($1) => {
            return platform == PLATFORM.m ? `pxtorem(${Math.round($1.split('px')[0] * 10)/ 10}px)` : `${Math.round($1.split('px')[0] * 10) / 10}px`;
        })
    }
    return value;
}
// scss字符串
let scssStr = '';

/**
 * mobile 1px边框处理
 * @param {*} orderStyle 样式
 * @param {*} platform 平台
 * @param {*} pageType 页面类型
 */
const handlethinBorder = (orderStyle, platform, pageType) => {
    let styleKeyList = Object.keys(orderStyle);
    if (platform === PLATFORM.pc||+pageType === PAGE_TYPE.ACTIVITY) {
        return false;
    }
    let isThinBorder = false;
    for (let j = 0; j < styleKeyList.length; j++) {
        let key = styleKeyList[j];
        let value = orderStyle[key];
        if (['border', 'border-top', 'border-left', 'border-right', 'border-bottom'].includes(key)) {
            let [borderWidth, borderColor] = value.split(" ")
            if (borderWidth == '1px') {
                let borderRadiusVal = orderStyle['border-radius'] || 0;
                switch (key) {
                case "border":
                    orderStyle[key] = `@include thinBorder((top,left,bottom, right), ${borderColor}, ${addpxtorem(borderRadiusVal, platform)})`
                    break;
                case "border-top":
                    orderStyle[key] = `@include thinBorder(top, ${borderColor}, ${addpxtorem(borderRadiusVal, platform)})`
                    break;
                case "border-bottom":
                    orderStyle[key] = `@include thinBorder(bottom, ${borderColor}, ${addpxtorem(borderRadiusVal, platform)})`
                    break;
                case "border-left":
                    orderStyle[key] = `@include thinBorder(left, ${borderColor}, ${addpxtorem(borderRadiusVal, platform)})`
                    break;
                case "border-right":
                    orderStyle[key] = `@include thinBorder(right, ${borderColor}, ${addpxtorem(borderRadiusVal, platform)})`
                    break;
                }
                // 删除 border-radius
                delete orderStyle['border-radius'];
                isThinBorder = true;
                break;
            }
        }
    }

    return isThinBorder;
}

const transformScssFormat = (data, platform, pageType,classPrefix, size, layer = 1) => {
    let styleTab = '';
    let classTab = '';
    let count = 0;
    while (count < layer) {
        styleTab += '\t'
        if (count < layer - 1) {
            classTab += '\t'
        }
        count++;
    }
    for (var i = 0; i < data.length; i++) {
        //如果有公共样式
        if (data[i].commonStyle) {
            scssStr += layer == 1 ? `.${classPrefix+data[i].className} {\n${styleTab}` : `${classTab}.${classPrefix+data[i].className} {\n${styleTab}`;
            let orderStyle = handleCssOrder(data[i].commonStyle);
            let isThinBorder = handlethinBorder(orderStyle, platform, pageType); // 处理细边框
            let styleKeyList = Object.keys(orderStyle);
            for (let j = 0; j < styleKeyList.length; j++) {
                let key = styleKeyList[j];
                let value = orderStyle[key];
                if (isThinBorder && ['border', 'border-top', 'border-left', 'border-right', 'border-bottom'].includes(key)) {
                    if (j != styleKeyList.length - 1) {
                        scssStr += `${value};\n${styleTab}`
                    } else {
                        scssStr += `${value};\n`
                    }
                } else {
                    //修复undefindpx的bug
                    value = addpxtorem(value, platform);
                    if (!/undefind/.test(value)) {
                        if (j != styleKeyList.length - 1) {
                            scssStr += `${key}: ${value};\n${styleTab}`
                        } else {
                            scssStr += `${key}: ${value};\n`
                        }
                    }
                }
            }
            // 私有样式
            if (Object.keys(data[i].onlyStyle).length>0) {
                scssStr += layer == 1 ? `\t&.${data[i].subClassName} {\n${styleTab}\t` : `${classTab}\t&.${data[i].subClassName} {\n${styleTab}\t`;
                let orderStyle = handleCssOrder(data[i].onlyStyle);
                let isThinBorder = handlethinBorder(orderStyle, platform, pageType); // 处理细边框
                let styleKeyList = Object.keys(orderStyle);
                for (let j1 = 0; j1 < styleKeyList.length; j1++) {
                    let key = styleKeyList[j1];
                    let value = orderStyle[key];
                    if (isThinBorder && ['border', 'border-top', 'border-left', 'border-right', 'border-bottom'].includes(key)) {
                        if (j1 != styleKeyList.length - 1) {
                            scssStr += `${value};\n${styleTab}`
                        } else {
                            scssStr += `${value};\n`
                        }
                    } else {
                        //修复undefindpx的bug
                        value = addpxtorem(value, platform);
                        if (!/undefind/.test(value)) {
                            if (j1 != styleKeyList.length - 1) {
                                scssStr += `${key}: ${value};\n${styleTab}`
                            } else {
                                scssStr += `${key}: ${value};\n`
                            }
                        }
                    }
                }
                scssStr += layer == 1 ? `\t\}\n` : `${classTab}\t\}\n`
            }
            if (data[i].children) {
                let now = layer + 1;
                transformScssFormat(data[i].children, platform,pageType,classPrefix, size, now)
            }
            scssStr += layer == 1 ? `\}\n` : `${classTab}\}\n`
        } else {
            scssStr += layer == 1 ? `.${classPrefix+data[i].className} {\n${styleTab}` : `${classTab}.${classPrefix+data[i].className} {\n${styleTab}`;
            let orderStyle = handleCssOrder(data[i].style);
            let isThinBorder = handlethinBorder(orderStyle, platform, pageType); // 处理细边框
            let styleKeyList = Object.keys(orderStyle);
            for (let j = 0; j < styleKeyList.length; j++) {
                let key = styleKeyList[j];
                let value = orderStyle[key];
                if (isThinBorder && ['border', 'border-top', 'border-left', 'border-right', 'border-bottom'].includes(key)) {
                    if (j != styleKeyList.length - 1) {
                        scssStr += `${value};\n${styleTab}`
                    } else {
                        scssStr += `${value};\n`
                    }
                } else {
                    //修复undefindpx的bug
                    value = addpxtorem(value, platform);
                    if (!/undefind/.test(value)) {
                        if (j != styleKeyList.length - 1) {
                            scssStr += `${key}: ${value};\n${styleTab}`
                        } else {
                            scssStr += `${key}: ${value};\n`
                        }
                    }
                }
            }
            if (data[i].children) {
                let now = layer + 1;
                transformScssFormat(data[i].children, platform,pageType,classPrefix, size, now)
            }
            scssStr += layer == 1 ? `\}\n` : `${classTab}\}\n`
        }
        
    }
    return scssStr;
}

const generaterScss = (data, platform, size, pageType,classPrefix) => {
    const draftSize = size / 7.5;
    // scss 基础变量
    let scss = `@function pxtorem($px){
    @return $px/${draftSize}px * 1rem;
}

@mixin thinBorder($directionMaps: bottom, $color: #ccc, $radius:(0, 0, 0, 0), $position: after) {
        $isOnlyOneDir: string==type-of($directionMaps);

        @if ($isOnlyOneDir) {
        $directionMaps: ($directionMaps);
        }

        @each $directionMap in $directionMaps {
        border-#{$directionMap}: 1px solid $color;
        }

        @if(list==type-of($radius)) {
        border-radius: nth($radius, 1) nth($radius, 2) nth($radius, 3) nth($radius, 4);
        }

        @else {
        border-radius: $radius;
        }

        @media only screen and (-webkit-min-device-pixel-ratio: 2) {
        & {
            position: relative;

            @each $directionMap in $directionMaps {
                border-#{$directionMap}: none;
            }
        }

        &:#{$position} {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            display: block;
            width: 200%;
            height: 200%;
            transform: scale(0.5);
            box-sizing: border-box;
            padding: 1px;
            transform-origin: 0 0;
            pointer-events: none;
            border: 0 solid $color;

            @each $directionMap in $directionMaps {
                border-#{$directionMap}-width: 1px;
            }

            @if(list==type-of($radius)) {
                border-radius: nth($radius, 1)*2 nth($radius, 2)*2 nth($radius, 3)*2 nth($radius, 4)*2;
            }

            @else {
                border-radius: $radius*2;
            }

        }
        }

        @media only screen and (-webkit-min-device-pixel-ratio: 3) {
        &:#{$position} {

            @if(list==type-of($radius)) {
                border-radius: nth($radius, 1)*3 nth($radius, 2)*3 nth($radius, 3)*3 nth($radius, 4)*3;
            }

            @else {
                border-radius: $radius*3;
            }

            width: 300%;
            height: 300%;
            transform: scale(0.3333);
        }
   }
}
  `;
    if (platform===PLATFORM.pc) {
        scss = '';
    }
    //重新清零，防止不同画板的scss累加
    scssStr = '';
    scss += transformScssFormat(data, platform, pageType,classPrefix, size);
    return scss;
}

module.exports = generaterScss;
