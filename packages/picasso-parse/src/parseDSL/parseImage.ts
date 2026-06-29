
import { SKLayer,Image } from '../types';

/**
 * 切片(Slice) => 图片
 * @param image Picasso-DSL图层
 * @param layer Sketch图层
 */
const parseImage = (image: any, layer: SKLayer, type: string): Image => {
    // 画板图赋值
    if (layer._class === 'artboard') {
        image.value = layer.imageUrl;
    // 切片转换为图片
    } else if (layer.imageUrl) {
        if (type === 'lowcode') {
            image.type = 'WBImage';
        } else {
            image.type = 'Image';
        }

        image.value = layer.imageUrl;
    }

    return image;
}

export default parseImage;
