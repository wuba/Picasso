

import { SKLayer,Layer } from '../types';

/**
 * 
 * 坐标格式转换，将相对坐标系转换为绝对坐标系
 * 
 */

const formatCoordinate = (layers: Layer[], groupX: number = 0, groupY: number = 0, sizeX: number = 1, sizeY: number = 1, parentList: string[] = []):Layer[] => {
    
    layers = layers.map((layer: Layer) => {

        // 背景色记录
        let bg = '0-0-0-0';
        if (layer.backgroundColor && layer.hasBackgroundColor && layer.includeBackgroundColorInExport) {
            const { red, green, blue, alpha } = layer.backgroundColor;
            bg = `${red}-${green}-${blue}-${alpha}`;
        }

        // 当前父图层属性列表
        let currParentList:string[] = [`${layer.frame.x},${layer.frame.y},${layer.frame.imgWidth},${layer.frame.imgHeight},${layer.do_objectID},${layer._class},${bg}`, ...parentList];
        layer.parentList = currParentList;

        layer.frame = {
            _class: 'rect',
            x: layer.frame.x * sizeX + groupX,
            y: layer.frame.y * sizeY + groupY,
            imgWidth: layer.frame.width,
            imgHeight: layer.frame.height,
            width: layer.frame.width * sizeX,
            height: layer.frame.height * sizeY,
            sizeX,
            sizeY,
        }
        // 当前缩放比例
        let currSizeX = sizeX,currSizeY = sizeY;
        //基础缩放比例计算
        if (layer._class === 'symbolInstance' && Array.isArray(layer.layers)&&layer.layers.length===1&&layer.layers[0]._class === 'symbolMaster') {
            let symbolInstanceRect = layer.frame;
            let symbolMasterRect = layer.layers[0].frame;
            currSizeX = sizeX*symbolInstanceRect.width / symbolMasterRect.width;
            currSizeY = sizeY*symbolInstanceRect.height / symbolMasterRect.height;
        }

        if (Array.isArray(layer.layers)) {
            layer.layers = formatCoordinate(layer.layers, layer.frame.x, layer.frame.y, currSizeX, currSizeY, currParentList);
        }

        return layer;
    })
    
    return layers;
}

export default formatCoordinate;
