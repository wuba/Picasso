const handleOverMask = require('./handleOverMask');
const generateRecord = require('./generateRecord');

function formatTreeData(data, sketchId, sketchName, artboardIndex, artboardName) {
    if (!data.layers) return [];
    let val = [];
    for (let j = 0; j < data.layers.length; j++) {
        let layer = data.layers[j];
        //bitmap 超出父容器，采取截取措施,切出来成背景色
        if (layer._class == 'bitmap' && data.frame && layer.frame && !layer.realFrame && layer.isVisible) {
            let realFrame = JSON.parse(JSON.stringify(layer.frame));
            if (data._class != 'group' && layer.rotation % 180 == 0) {
                layer = handleOverMask(layer, data);
            }
            layer.maskStyle = {
                'background-position': `${realFrame.x - layer.frame.x}px ${realFrame.y - layer.frame.y}px`,
                'background-size': `${realFrame.width}px ${realFrame.height}px`,
                "background-repeat": 'no-repeat'
            };
            //切片处理 
        } else if (layer.realFrame && layer._class == 'bitmap' && layer.isVisible) {
            let realFrame = JSON.parse(JSON.stringify(layer.realFrame));
            layer.maskStyle = {
                'background-position': `${realFrame.x - layer.frame.x}px ${realFrame.y - layer.frame.y}px`,
                'background-size': `${realFrame.width}px ${realFrame.height}px`,
                'background-repeat': 'no-repeat'
            };
        }
        if (layer.frame && layer.isVisible && layer._class != 'slice') {

            if (layer.style && layer.style.contextSettings) { // 删除 透明度为 0 的结构
                if (layer.style.contextSettings.opacity != 0) {
                    val.push(...generateRecord(layer, data))
                }
            } else {
                val.push(...generateRecord(layer, data));
            }
            if (layer.istransformContain && Array.isArray(layer.layers)) {
                for (let o = 0; o < layer.layers.length; o++) {
                    layer.layers[o].parentId = layer.do_objectID;
                }
            }
        }

        if (layer.isVisible && Array.isArray(layer.layers) && !layer.isDelete && layer.layers.length > 0) {
            val = val.concat(formatTreeData(layer, sketchId, sketchName, artboardIndex, artboardName));
        }
    }

    return val
}

module.exports = formatTreeData
