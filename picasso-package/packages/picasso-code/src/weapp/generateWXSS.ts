import handleCssOrder from '../web/handleCssOrder';
import { Layer } from '../types';

/**
 *  px转换为rpx
 *  
 */
const pxtorpx = (value:any,size:any) => {
    const scale = 750 / size
    if (/px/.test(value)) {
        value = value.replace(/((\.|\d|\e|\-)+)px/g, ($1, $2) => {
            return `${Math.round($1.split('px')[0] * 10 * scale) / 10}rpx`
        })
    }
    return value
}

const generateWeappStyle = (data: Layer, size:any) => {
    let style = []
    if (data.style && Object.keys(data.style).length) {
        for (var key in data.style) {
            if (
                data.style.hasOwnProperty(key) &&
                data.style[key] != undefined
            ) {
                let currValue = data.style[key]
                currValue = pxtorpx(currValue, size)
                style.push(`${key}: ${currValue};`)
            }
        }
    }
    return style.join('\n')
}

const generateWXSS = (data:Layer[], size:any, parentNodeName: any = '') => {
    let wxss = []
    for (let i = 0; i < data.length; i++) {
        let record = data[i];
        let nodeName = parentNodeName
                ? parentNodeName + ' .' + record.className
                : '.' + record.className
        wxss.push(nodeName + '{')
        wxss.push(generateWeappStyle(record, size))
        wxss.push('}')

        if (record.children) {
            wxss.push(generateWXSS(record.children, size, nodeName))
        }
    }
    return wxss.join('\n')
}

export default generateWXSS;
