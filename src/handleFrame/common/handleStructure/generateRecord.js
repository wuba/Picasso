let {
    getEnabledFill,
    getFillColor,
    getValue
} = require('../../../common/utils');
const handleString = require('../handleString');
const handleFill = require('../handleFill');
const handleRotate = require('./handleRotate');

const handleBackGroundColor = require('../handleStyle/handleBackGroundColor');
const handleArtboardBackGroundColor = require('../handleStyle/handleArtboardBackGroundColor');
const handleBorderStyle = require('../handleStyle/handleBorderStyle');
const calculateShadow = require('../handleStyle/calculateShadow')
const calculateBorderRadius = require('../handleStyle/calculateBorderRadius')
/**
 * 每层json结构属性处理
 */
module.exports = (layer, data) => {
    let val = [];
    let transform = [];
    if (layer._class != 'shapeGroup') {
        transform = handleRotate(layer);
    }
    if (transform.length > 0 || (layer._class != 'group' && layer._class != 'shapeGroup')) {
        var record = {};
        // 标准的信息结构
        record.id = require('../../../common/utils').uniqueId();
        record.do_objectID = layer.do_objectID;
        record.name = layer.name;
        record._class = layer._class;
        record.type = 'Container'; //默认是 Container,组件类型
        record.style = {}; // 初始化 style 的值
        record.element = {
            tag: 'div'
        }; // 默认标签都渲染为 div
        //旋转处理
        if (layer.parentId) {
            record.parentId = layer.parentId;
        }

        if (transform.length > 0) {
            layer.istransformContain = true;
            record.istransformContain = true;
            record.style['transform'] = transform.join(' ');
        }
        // }
        //处理圆角
        if (calculateBorderRadius(layer) && calculateBorderRadius(layer) != '0px') {
            record.style['border-radius'] = calculateBorderRadius(layer);
        }

        if (calculateShadow(layer)) {
            if (layer._class == 'text') {
                record.style['text-shadow'] = calculateShadow(layer);
            } else {
                record.style['box-shadow'] = calculateShadow(layer);
            }
        }

        if (layer.frame) {
            record.x = layer.frame.x;
            record.y = layer.frame.y;
            record.width = layer.frame.width;
            record.height = layer.frame.height;

            //垂直线，则删除掉
            if (record.width <= 1 && record.height > 200) {
                layer.isDelete = true;
            }
        }
        // 圆形组件处理
        if ((layer._class == 'oval' && layer.isVisible && layer.isRegular)) {
            record.style['border-radius'] = '50%';
        }
        handleBorderStyle(record, layer);
        if (layer._class == 'artboard') {
            handleArtboardBackGroundColor(record, layer);
        } else if (layer._class == 'symbolMaster' && !layer.includeBackgroundColorInInstance) {// includeBackgroundColorInInstance=false 模块背景色在实例中无效
        } else if (layer.backgroundColor && layer.hasBackgroundColor) {
            handleBackGroundColor(record, layer);
        } else if (layer.style && Array.isArray(layer.style.fills) && layer.style.fills.length && layer.style.fills[layer.style.fills.length - 1].isEnabled && layer._class != 'text') { // 处理填充 fills,fills是数组，只支持单个情况,处理成背景色, 文本的背景另外设置
            handleFill(record, layer);
        }
        //text 字体大小颜色等信息，及内容
        if (layer._class == 'text' && layer.style) {
            handleString(layer, record);
            // fill 对文本的填充覆盖文本原来的颜色
            let fill = getEnabledFill(layer);
            fill ? record.style['color'] = getFillColor(fill) : null;
        }
        // 处理遮罩的背景
        if (layer.hasClippingMask) {
            if (layer.bgList) {
                record.bgList = layer.bgList;
            }
            if ((record.style['border-radius'] == '50%' || record.height <= getValue(record.style['border-radius']) * 2) && data.layers.length > 1) { // 保证有兄弟元素
                record.style['overflow'] = 'hidden';
            }
            record.type = 'Mask';
        }
        //图片处理
        if (layer.image && layer.image._ref) {
            record.element = {
                type: 'img',
                val: layer.image._ref.slice(layer.image._ref.lastIndexOf('\/') + 1)
            }
            record.type = 'Image'
            record.value = layer.image._ref.slice(layer.image._ref.lastIndexOf('\/') + 1);
            if (!/.(png|pdf)$/.test(record.value)) {
                record.element.val = record.element.val + '.png';
                record.value = record.value + '.png';
            }
            //图片类型，背景色去掉
            delete record.style['background-color'];
        }
        if (layer.maskStyle) {
            record.style = {
                ...record.style,
                ...layer.maskStyle
            };

            record.isMask = true;
            record.type = 'Image';
        }
        if (!layer.isDelete) {
            val.push(record);
        }
    }
    return val;
}
