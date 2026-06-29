
import { DLaysr } from '../types';
/**
 * 判断图层是否为单行纯文本
 * 
 * @param {Object} layer 图层对象
 */
const isSingleText = (layer: DLaysr) => {
    if (layer.type != "Text") {
        return false;
    }
    if (!layer.style) {
        return false;
    }
    if (layer.style.borderRadius
        || layer.structure.border
        || layer.style.background.color
        || layer.style.background.image
        || (layer.structure.height && layer.style.textStyle.fontSize && layer.style.textStyle.fontSize <= layer.structure.height * 0.5)
    ) {
        return false;
    }
    return true;
}

export default (data: DLaysr[]) => {
    // 判断是否为M端页面
    const isM = [375,750].includes(data[0].structure.width);

    data[0].style.width = data[0].structure.width;
    data[0].style.height = data[0].structure.height;
    data[0].style.overflow = 'hidden';
    // PC 端处理
    if(!isM){
        data[0].style.position = 'absolute';
        data[0].style = {
            ...data[0].style,
            position: 'absolute',
            left: '50%',
            top: 0,
            marginLeft: - Math.round(data[0].structure.width*0.5)
        }
    // M端处理
    } else {
        data[0].style.position = 'relative';
    }
    const childLayerList = data[0].children.map(item => {
        item.style = {
            ...item.style,
            position: 'absolute',
            left: Math.round(item.structure.x),
            top: Math.round(item.structure.y),
            width: item.structure.width,
            height: item.structure.height,
        }
        /**
         * 单行文本不设置宽度
         */
        if (isSingleText(item)) {
            item.style.width = 'auto';
        }
        return item;
    });
    return [{
        ...data[0],
        children: childLayerList
    }];
}
