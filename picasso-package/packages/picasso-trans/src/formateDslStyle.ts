// import * as fs from 'fs'
import {
    generateProperty,
    generateColor,
    generateBorderRadius,
    generateMargin,
} from './utils'
import { dslPxtoRem } from './dslPxtoRem'
import { dslPxtoRpx } from './dslPxtoRpx'
import cssOrder from './cssOrder'

// 驼峰改连接符
const toKebabCase = (str: any) => str.replace(/([A-Z])/g, '-$1').toLowerCase()

const addPx = (val: any) => {
    if (typeof val == 'number') return `${val}px`
    return val
}

// 转rem
export const formateDslRemStyle = (formateDsl: any, remScale:any) => {
    // 标注稿以rem形式展示
    if (!remScale || isNaN(Number(remScale))) return formateDsl
    for (let item of formateDsl) {
        let remStyle: any = {} // 样式集合
        remStyle = dslPxtoRem(item.style, remScale);
        item.style = remStyle;
        if (item.children && item.children.length) {
            formateDslRemStyle(item.children, remScale)
        }
    }
    return formateDsl
}

//转rpx
export const formatDslRpxStyle = (formateDsl: any, size: number) => {
    for (let item of formateDsl) {
        let rpxStyle: any = {} // 样式集合
        rpxStyle = dslPxtoRpx(item.style, size);
        item.style = rpxStyle;
        if (item.children && item.children.length) {
            formatDslRpxStyle(item.children, size)
        }
    }
    return formateDsl
}

/**
 * DSL=> webStyle 转换方法
 * @param data
 */
export const formateDslStyle = (data: any) => {
    //let formateDsl = JSON.parse(JSON.stringify(data))

    for (let i = 0; i < data.length; i++) {
        let style: any = {} // 样式集合
        const item = data[i];
        // 处理 structure
        if (item.structure && Object.keys(item.structure).length) {
            for (var key in item.structure) {
                let currValue = item.structure[key]
                // sketch 设计稿解析过来的没有 margin 和 padding
                switch (key) {
                    case 'border':
                        style = {
                            ...style,
                            ...generateProperty(currValue),
                        }
                        break
                    case 'width':
                        style[key] = `${Math.round(currValue * 100) / 100}px`
                        break
                    case 'height':
                        style[key] = `${Math.round(currValue * 100) / 100}px`
                        break
                    case 'x':
                    case 'y':
                        if (style.position) {
                            style[key] = `${Math.round(currValue * 100) / 100}px`
                        }
                        break
                    case 'zIndex':
                        if (style.position) {
                            style[toKebabCase(key)] = currValue;
                        }
                        break
                    default: 
                        style[toKebabCase(key)] = generateMargin(currValue)
                        break
                }
            }
        }

        // 处理 style
        if (item.style && Object.keys(item.style).length) {
            for (var key in item.style) {
                if (
                    item.style.hasOwnProperty(key) &&
                    item.style[key] != undefined
                ) {
                    let currValue = item.style[key]
                    switch (key) {
                        case 'textStyle': // text样式直接放在style里
                            for (let textKey of Object.keys(currValue)) {
                                let textVal = currValue[textKey]
                                // 颜色处理
                                if (textKey == 'color') {
                                    textVal = generateColor(textVal)
                                }
                                // px处理
                                if (textKey == 'lineHeight' || textKey == 'fontSize' || textKey == 'textIndent'|| textKey == 'letterSpacing') {
                                    textVal = `${Math.round(currValue[textKey] * 100) / 100}px`
                                }
                                // 其他不处理
                                style[toKebabCase(textKey)] = textVal
                            }
                            break
                        case 'background': // background样式放到background里
                            let propertyVal
                            for (let backgroundKey of Object.keys(currValue)) {
                                let backgroundVal = currValue[backgroundKey]
                                if (backgroundKey == 'linearGradient') {
                                    let { gAngle, gList } = backgroundVal;
                                    let list = gList.map((ref: any) => {
                                           return `${generateColor(ref.color)} ${ref.position*100}%`
                                        });
                                    list = [...new Set(list)];
                                    style['background'] = `linear-gradient(${
                                        Math.round(gAngle * 100) / 100
                                    }deg, ${list.join(',')})`
                                } else if (backgroundKey == 'radialGradient') {
                                    // background-image: radial-gradient(shape size at top left, start-color, ..., last-color);
                                    // background-image: radial-gradient(4.47rem 2rem at 1rem 2rem, red 5%, green 15%, blue 60%)

                                    let {
                                        backgroundVal: any,
                                        smallRadius,
                                        largeRadius,
                                        position,
                                        gList,
                                    } = backgroundVal
                                    let list = gList.map((ref: any) => {
                                        return `${generateColor(ref.color)} ${ref.position*100}%`
                                    })
                                    style['background'] = `radial-gradient(${
                                        Math.round(smallRadius * 100) / 100
                                    }px ${
                                        Math.round(largeRadius * 100) / 100
                                    }px at ${
                                        Math.round(position.left * 100) / 100
                                    }px ${
                                        Math.round(-position.top * 100) / 100
                                    }px, ${list.join(',')})`
                                } else if (typeof backgroundVal == 'object') {
                                    if (backgroundKey == 'color') {
                                        propertyVal = generateColor(
                                            backgroundVal
                                        )
                                    } else if (backgroundKey == 'image' && item.type !== 'Image') {
                                        propertyVal =`url(../images/${backgroundVal.url})`;
                                    } else { // position、size
                                        let valList = []
                                        for (let ref of Object.keys(backgroundVal)) {
                                            valList.push(
                                                addPx(backgroundVal[ref])
                                            )
                                        }
                                        propertyVal = valList.join(' ')
                                    }
                                    style[`background-${backgroundKey}`] = propertyVal
                                    // 如果为图片，则背景色无效
                                    if (item.type==='Image') {
                                        delete style['background-color']
                                    }
                                } else if (backgroundKey == 'repeat') {
                                    // style[`background-${backgroundKey}`] = backgroundVal
                                }
                            }
                            break
                        case 'textShadow':
                        case 'boxShadow':
                            let shodowList = []
                            for (let item of currValue) {
                                let {
                                    offsetX,
                                    offsetY,
                                    spread,
                                    blurRadius,
                                    color,
                                    type,
                                } = item
                                shodowList.push(
                                    type
                                        ? `${offsetX}px ${offsetY}px ${blurRadius}px ${spread}px ${generateColor(color)} ${type}`
                                        : `${offsetX}px ${offsetY}px ${blurRadius}px ${spread}px ${generateColor(color)}`
                                )
                            }
                            if (shodowList.length) {
                                style[toKebabCase(key)] = shodowList.join(', ')
                            }
                            break
                        case 'transform':
                            let { scale = {}, rotate } = currValue
                            let transform = []
                            if (
                                scale.horizontal != undefined &&
                                scale.vertical != undefined
                            ) {
                                transform.push(`scale(${scale.horizontal},${scale.vertical})`)
                            }
                            if (rotate != undefined) {
                                transform.push(`rotate(${rotate}deg)`)
                            }
                            if (transform && transform.length) {
                                style['transform'] = transform.join(' ')
                            }
                            break
                        case 'borderRadius':
                            let borderRadius = generateBorderRadius(currValue)
                            if (borderRadius) {
                                style['border-radius'] = borderRadius
                            }
                            break
                        case 'zIndex':
                        case 'fontWeight':
                            style[key] = currValue
                            break
                        case 'lineHeight':
                            style[toKebabCase(key)] = currValue
                            break  
                        case 'width':
                        case 'height':
                        case 'marginTop':
                        case 'marginRight':
                        case 'marginLeft':
                        case 'marginBottom':
                        case 'paddingTop':
                        case 'paddingRight':
                        case 'paddingLeft':
                        case 'paddingBottom':   
                            typeof currValue == 'string'
                                ? (style[toKebabCase(key)] = currValue)
                                : (style[toKebabCase(key)] = `${currValue}px`)
                            break
                        default: 
                            typeof currValue == 'string'
                                ? (style[toKebabCase(key)] = currValue)
                                : (style[toKebabCase(key)] = `${currValue}px`)
                    }
                }
            }
        }

        // fs.writeFileSync(`./test/style_${item.name}.json`, JSON.stringify(style, null,2));

        // css 排序
        data[i].style = cssOrder(style);
        if (data[i].children && data[i].children.length) {
            data[i].children = formateDslStyle(data[i].children);
        }
        
    }

    return data
}
