import { Layer } from '../types'
// 公用方法
export const isEqualWidth = (data: Layer[]) => {
    if (data.length < 2) return false;
    // 判断所有的元素是否等宽
    const setList = new Set();
    
    for (let item of data) {
        setList.add(item.structure.width);
    }

    return setList.keys.length === 1;
}

export const isEqualHeight = (data: Layer[]) =>{
    if (data.length < 2) return false;
    // 判断所有的元素是否等高
    const setList = new Set();
    for (let item of data) {
        setList.add(item.structure.height);
    }

    return setList.keys.length === 1;
}

// 第一层级只包含一个文本节点
export const hasTextType = (data: Layer[]) => {
        let flag = false;
        for (let item of data) {
            if (
                item.type === "Container" &&
                item.children?.length
            ) {
                let textList = [];
                for (let subItem of item.children) {
                    if (subItem.type === 'Text') {
                        textList.push(subItem.name)
                    }
                }
                flag = textList.length === 1;
                if (!flag) {
                    break;
                }
            }
        }

        return flag
    }

    // 多行之间判断是否是否相同间距
export const isSameSpacing = (data: Layer[]) => {
    if (data.length < 2) return false;
    let flag = true;
    let space = data[1].structure.x - data[0].structure.x - data[0].structure.width;

    for (let i = 2; i < data.length; i++) {
        if (
            data[i].structure.y == data[i - 1].structure.y &&
            Math.abs(data[i].structure.x - data[i - 1].structure.x - data[i - 1].structure.width - space) > 2
        ) {
            flag = false;
            break;
        }
    }

    return flag;
}

export const hasBorder = (data: Layer[]) => {
    for (let item of data) {
        if (!(item.structure.border && item.structure.border.top.width)) {
            return false;
        }
    }

    return true;
}

export const hasBackground = (data: Layer[]) => {
    for (let item of data) {
        if (!item.style?.background?.color) {
            return false;
        }
    }

    return true;
}

