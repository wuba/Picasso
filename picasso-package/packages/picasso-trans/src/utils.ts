export const generateColor = ({
    red = '',
    green = '',
    blue = '',
    alpha = 1,
} = {}) => {
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

// border处理
export const generateProperty = (obj: any) => {
    let rst: any = {}
    if (Object.prototype.toString.call(obj)!=="[object Object]") return rst
    let keys = Object.keys(obj)
    if (!keys || !keys.length) return rst

    const isObjValEqual = (obj1: any, obj2: any) => {
        let isEqual = true
        let objItem = Object.keys(obj1)
        for (let i = 0; i < objItem.length; i++) {
            if (objItem[i] == 'color') {
                if (
                    obj1.color.alpha != obj2.color.alpha ||
                    obj1.color.red != obj2.color.red ||
                    obj1.color.blue != obj2.color.blue ||
                    obj1.color.green != obj2.color.green
                ) {
                    isEqual = false
                }
            } else {
                if (obj1[objItem[i]] != obj2[objItem[i]]) {
                    isEqual = false
                    break
                }
            }
        }
        return isEqual
    }
    
    // 判断四个方向的值都是一样的
    if (
        keys.length == 4 &&
        isObjValEqual(obj.top, obj.bottom) &&
        isObjValEqual(obj.left, obj.right) &&
        isObjValEqual(obj.top, obj.left)
    ) {
        let { width, color, style } = obj.left
        rst.border = `${width}px ${style} ${generateColor(color)}`
    } else {
        for (let key of keys) {
            // top right bottom left
            if (obj[key] != undefined) {
                let { width, color, style } = obj[key]
                rst[`border-${key}`] = `${width}px ${style} ${generateColor(
                    color
                )}`
            }
        }
    }
    return rst
}

// border-radius处理
export const generateBorderRadius = (obj: any) => {
    if (typeof obj == 'string') return obj
    if (typeof obj == 'object') {
        let values = Object.values(obj)
        if (!values.length|| !values[0]) return ''
        if (values.length == 4 && new Set(values).size === 1) {
            return typeof obj.topLeft === 'string' ? obj.topLeft : `${obj.topLeft}px`
        }
        return `${obj.topLeft}px ${obj.topRight}px ${obj.bottomRight}px ${obj.bottomLeft}px`
    }
}

// margin、padding处理
export const generateMargin = (obj: any) => {
    if (typeof obj == 'string') return obj
    if (typeof obj == 'object') {
        let values = Object.values(obj)
        if (!values.length) return ''
        if (values.length == 4 && new Set(values).size == 1) {
            return `${obj.top}px`
        }
        return `${obj.top}px ${obj.right}px ${obj.bottom}px ${obj.left}px`
    }
}
