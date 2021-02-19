/*
 * @Author: iChengbo
 * @Date: 2020-07-08 10:59:55
 * @LastEditors: iChengbo
 * @LastEditTime: 2020-09-08 19:07:57
 * @FilePath: /picasso-core/packages/picasso-trans/src/transRNStyle.ts
 */
import {
    generateProperty,
    generateColor,
    generateBorderRadius,
} from './utils'
import cssOrder from './cssOrder'

// const humpKey2 = key.replace(/-(\w)/g, ($, $1) => $1.toUpperCase());

const toHumpKey = (str: any) => str.replace(/-(\w)/g, ($, $1) => $1.toUpperCase());

const getValidValue = (object, key) => {
    if (!!object && !!object.key) {
        return object.key;
    }
}

export const transRNStyle = (data: any) => {

    console.log("-----------transRNStyle-------------")
    // console.log("data: ", data)
    for (let item of data) {
        // 样式集合
        let style: any = {};
        // 布局
        if (item.structure && Object.keys(item.structure).length) {
            for (var key in item.structure) {
                let currValue = item.structure[key]
                // console.log("布局：", key)
                switch (key) {
                    case 'x':
                    case 'y':
                        // case 'zIndex':
                        break;
                    case 'width':
                    case 'height':
                        if (item.type == 'Text') {
                            if (key == 'width') {
                                const _fontSize = (item.style && item.style.textStyle && item.style.textStyle.fontSize) ? item.style.textStyle.fontSize : 28
                                const dis: number = parseInt(item.style.width) - _fontSize * item.value.length;
                                if (Math.abs(dis) < 100) {
                                    style['textAlign'] = 'left';
                                } else {
                                    style[key] = parseInt(currValue);
                                }
                            } else {
                                // TODO：文本设高度的话，需处理垂直居中问题
                                style[key] = parseInt(currValue);
                                // style['lineHeight'] = parseInt(currValue) / 2;
                                // style['flexDirection'] = 'row';
                                // style['alignItems'] = 'center';
                                style['textAlignVertical'] = 'center';
                            }
                        } else {
                            style[key] = parseInt(currValue);
                        }
                        break;
                    case 'border':
                        if (!!currValue) {
                            if(
                                currValue.top&&currValue.left&&currValue.right&&currValue.bottom
                              &&JSON.stringify(currValue.top) === JSON.stringify(currValue.right)
                              &&JSON.stringify(currValue.top) === JSON.stringify(currValue.left)
                              &&JSON.stringify(currValue.top) === JSON.stringify(currValue.bottom)
                            ) {
                                style['borderStyle'] = currValue.top?.style;
                                style['borderWidth'] = currValue.top?.width;
                                style['borderColor'] = generateColor(currValue.top?.color);
                            } else {
                                style['borderTopStyle'] = currValue.top?.style;
                                style['borderTopWidth'] = currValue.top?.width;
                                style['borderTopColor'] = generateColor(currValue.top?.color);
                                style['borderRigthStyle'] = currValue.right?.style;
                                style['borderRightWidth'] = currValue.right?.width;
                                style['borderRightColor'] = generateColor(currValue.right?.color);
                                style['borderBottomStyle'] = currValue.bottom?.style;
                                style['borderBottomWidth'] = currValue.bottom?.width;
                                style['borderBottomColor'] = generateColor(currValue.bottom?.color);
                                style['borderLeftStyle'] = currValue.left?.style;
                                style['borderLeftWidth'] = currValue.left?.width;
                                style['borderLeftColor'] = generateColor(currValue.left?.color);
                            }
                        }
                        break;
                    case 'margin':
                        if (!!currValue) {
                            style['marginTop'] = currValue.top;
                            style['marginBottom'] = currValue.bottom;
                            style['marginLeft'] = currValue.left;
                            style['marginRight'] = currValue.right;
                        }
                        break;
                    case 'padding':
                        if (!!currValue) {
                            style['paddingTop'] = currValue.top;
                            style['paddingBottom'] = currValue.bottom;
                            style['paddingLeft'] = currValue.left;
                            style['paddingRight'] = currValue.right;
                        }
                        break;
                    default:
                        style[key] = currValue;
                        break;
                }
            }
        }
        // 样式
        if (item.style && Object.keys(item.style).length) {
            for (var key in item.style) {
                if (item.style.hasOwnProperty(key) && item.style[key] != undefined) {
                    let currValue = item.style[key];
                    // console.log("样式：", key)
                    switch (key) {
                        case 'marginTop':
                        case 'marginRight':
                        case 'marginLeft':
                        case 'marginBottom':
                        case 'paddingTop':
                        case 'paddingRight':
                        case 'paddingLeft':
                        case 'paddingBottom':
                            const _currValue = parseInt(currValue);
                            style[key] = !Number.isNaN(_currValue) ? _currValue : 0;
                            // style[key] = parseInt(currValue) / 2;
                            break;
                        case 'borderRadius':
                            if ( currValue['topLeft']
                                && currValue['topLeft'] === currValue['topRight']
                                && currValue['topLeft'] === currValue['bottomLeft']
                                && currValue['topLeft'] === currValue['bottomRight']
                            ) {
                                style['borderRadius'] = currValue['topLeft'];
                            } else {
                                if (currValue['topLeft']) {
                                    style['borderTopLeftRadius'] = currValue['topLeft'];
                                }
                                if (currValue['topRight']) {
                                    style['borderTopRightRadius'] = currValue['topRight'];
                                }
                                if (currValue['bottomLeft']) {
                                    style['borderBottomLeftRadius'] = currValue['bottomLeft'];
                                }
                                if (currValue['bottomRight']) {
                                    style['borderBottomRightRadius'] = currValue['bottomRight'];
                                }
                            }
                            break;
                        case 'justifyContent':
                        case 'alignItems':
                        case 'flexDirection':
                            style[key] = currValue;
                            break;
                        case 'textStyle':
                            for (let textKey of Object.keys(currValue)) {
                                if (!!currValue && !!currValue[textKey]) {
                                    let textVal = currValue[textKey]
                                    switch (textKey) {
                                        case 'wordBreak':
                                        case 'fontFamily':
                                            break;
                                        case 'fontWeight':
                                            style[textKey] = String(textVal);
                                            break;
                                        case 'lineHeight':
                                            // 确保行高稍大于文字尺寸，避免Android端文本被切头
                                            if (textVal - currValue['fontSize'] > 4) {
                                                style[textKey] = parseInt(textVal);
                                            }
                                            break;
                                        case 'fontSize':
                                            style[textKey] = parseInt(textVal);
                                            break;
                                        case 'color':
                                            textVal = generateColor(textVal);
                                            style[textKey] = textVal;
                                            break;
                                        case 'textAlign':
                                            // 布局为主
                                            if (!style['textAlign']) {
                                                style[textKey] = textVal;
                                            }
                                            break;
                                        default:
                                            style[textKey] = textVal;
                                            break;
                                    }
                                }
                            }
                            break;
                        case 'textShadow':
                            // TODO
                            break;
                        case 'background':
                            // console.log("背景样式", currValue)
                            for (let bgKey of Object.keys(currValue)) {
                                let bgVal = currValue[bgKey]
                                switch (bgKey) {
                                    case 'position':
                                        style['position'] = 'absolute';
                                        break;
                                    case 'color':
                                        bgVal = generateColor(bgVal)
                                        style['backgroundColor'] = bgVal;
                                        break;
                                    case 'image':
                                        // 背景图特殊处理，最终生成样式时需删除此属性
                                        style['backgroundImage'] = bgVal.url;
                                        break;
                                    case 'linearGradient':
                                        // 渐变特殊处理，最终生成样式时需删除此属性
                                        style['linearGradient'] = bgVal;
                                        break;
                                    case 'size':
                                        style['backgroundSize'] = bgVal;
                                        break;
                                    default:
                                        break;
                                }
                            }
                            break;

                        case 'boxShadow':
                            if (!!currValue && currValue.length > 0 && !!currValue[0].color && item.type == 'Container') {
                                style = {
                                    ...style,
                                    elevation: currValue[0].offsetY,
                                    // 以下属性，仅 IOS 可用
                                    shadowColor: generateColor(currValue[0].color),
                                    shadowOffset: {
                                        width: currValue[0].offsetX,
                                        height: currValue[0].offsetY,
                                    },
                                    shadowRadius: currValue[0].blurRadius,
                                    shadowOpacity: 1
                                }
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
        }
        // css 排序
        item.style = cssOrder(style);
        if (item.children && item.children.length) {
            transRNStyle(item.children);
        }
    }

    return data;
}
