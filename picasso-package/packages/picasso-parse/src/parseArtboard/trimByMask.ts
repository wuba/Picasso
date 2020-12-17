import { SKLayer,SKFrame } from '../types';

const calculateMaskIntersection = (parentMask: SKFrame, childMask: SKFrame) => {
    const maskFrame = { ...childMask };

    const defaultFrame: SKFrame = { _class: 'rect', x: 0, y: 0, width: 0, height: 0 };

    if (maskFrame.x + maskFrame.width <= parentMask.x) {
        return defaultFrame;
    }

    if (maskFrame.y + maskFrame.height <= parentMask.y) {
        return defaultFrame;
    }

    if (maskFrame.x >= parentMask.x + parentMask.width ) {
        return defaultFrame;
    }

    if (maskFrame.y >= parentMask.y + parentMask.height) {
        return defaultFrame;
    }

    if (maskFrame.x < parentMask.x) {
        maskFrame.width = maskFrame.x + maskFrame.width -parentMask.x;
        maskFrame.x = parentMask.x;
    }

    if (maskFrame.y  < parentMask.y) {
        maskFrame.height = maskFrame.y + maskFrame.height - parentMask.y;
        maskFrame.y = parentMask.y;
    }

    if (maskFrame.x + maskFrame.width > parentMask.x + parentMask.width ) {
        maskFrame.width = parentMask.x + parentMask.width - maskFrame.x;
    }

    if (maskFrame.y + maskFrame.height > parentMask.y + parentMask.height) {
        maskFrame.height = parentMask.y + parentMask.height - maskFrame.y;
    }

    return maskFrame;
}

// 定义mask参数类型
type MaskOptions = {
    flag: boolean,
    frame: SKFrame
}

/**
 * Mask剪切处理
 * 
 * 作用范围：Mask上层的兄弟元素及其子元素
 * 关键点：
 * 1. Artboard是最大的Mask
 * 2. hasClippingMask Mask图层标识
 * 3. shouldBreakMaskChain 中断Mask标识
 * @param layers 
 * @param param1 
 */
const _mask = (layers:SKLayer[], { flag = false, frame }: MaskOptions):SKLayer[] => {
     
    let currFrame: SKFrame;
    let maskFlag = false;

    // 标记阶段
    for (let i = 0; i < layers.length; i++) {
        // 中断mark, 从本层开始
        if (layers[i].shouldBreakMaskChain) {
            maskFlag = false;
        }

        if (flag || maskFlag) {
            if (flag&&maskFlag) {
                frame = calculateMaskIntersection(frame, currFrame);
            } else if(maskFlag) {
                frame = {...currFrame}
            }
            flag = true;
            // 存在mask的时候用mask进行剪切
            layers[i].frame = calculateMaskIntersection(frame, layers[i].frame);
        }

        // 是否中断
        if (layers[i].hasClippingMask) {
            maskFlag = true;
            currFrame = layers[i].frame;
        }

        // 递归子元素
        if (Array.isArray(layers[i].layers)) {
            layers[i].layers = _mask(layers[i].layers,{ flag, frame });
        }
    }

    // 删除超出画板的图层
    layers = layers.filter((layer:SKLayer): boolean => {
        if (layer.frame.width === 0 || layer.frame.height === 0) {
            return false;
        }

        return true;
    });

    return layers;
}

export default (layers: SKLayer[]): SKLayer[] => {

    return _mask(layers, { flag: true, frame: layers[0].frame });
}
