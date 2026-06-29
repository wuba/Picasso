import { SKLayer } from '../types';

const handleBorderCoordinate = (layers: SKLayer[]): SKLayer[] => {
    layers = layers.map((layer:SKLayer):SKLayer => {
        if (layer.style && layer.style.borders && layer._class != 'artboard') {
            let borderList = layer.style.borders.filter(item => item.isEnabled);
            // 只处理一层border的情况
            if (borderList.length == 1) {
                let borderStyle = borderList[0];
                if (borderStyle.position == 0) { // 中间边框
                    let w = borderStyle.thickness / 2;
                    layer.frame.width += borderStyle.thickness;
                    layer.frame.height += borderStyle.thickness;
                    layer.frame.x -= w;
                    layer.frame.y -= w;
                } else if (borderStyle.position == 2) { // 外边框
                    let w = borderStyle.thickness;
                    layer.frame.width += w * 2;
                    layer.frame.height += w * 2;
                    layer.frame.x -= w;
                    layer.frame.y -= w;
                }
            }
        }

        // 递归
        if (Array.isArray(layer.layers)) {
            layer.layers = handleBorderCoordinate(layer.layers);
        }

        return layer;
    })
    return layers;
}

export default handleBorderCoordinate;
