
import { Layer } from './types';

/**
 * 冗余html结构处理
 * 1.Container 子元素无背景，无边框属于无意义元素 -删除子元素处理
 * 2.Container 子元素有背景或者边框，父元素无背景及边框-删除父元素
 * 3.Image 父元素无背景及边框-删除父元素
 * 4.Image 子元素与父元素位置大小完全相同 -删除父元素
 * 5.父元素为artboard的情况下，不删除父元素
 * @param {Array} item
 */
const handleSingleLayer = (item:Layer) => {
    if (item.children && item.children.length == 1 && !(item.type == 'Mask' && item.style['border-radius'])) {
        //Container 子元素无背景，无边框属于无意义元素 -删除子元素处理
        if (item.children[0].type == 'Container' || (!item.children[0].type && (item.children[0].sign === '__li' || item.children[0].sign === '__oth'))) {
            if (!item.children[0].textContainer &&
                !item.children[0].structure.border &&
                item.children[0]._class != 'artboard' &&
                !item.children[0].style.transform &&
                !item.children[0].style.background&&
                !item.children[0].isList
            ) {
                if (item.children[0].children) {
                    item.children = JSON.parse(JSON.stringify(item.children[0].children));
                } else {
                    item.children = [];
                }
                item = handleSingleLayer(item);
            }
            //Container 子元素有背景或者边框 且父元素不为artboard
            else if (item._class != 'artboard' && !item.style.transform) {
                //父元素无背景及边框-删除父元素
                if (item.type === 'Container' && !item.children[0].structure.border && !item.style.background && !item.style.borderRadius) {
                    item = item.children[0];
                    item = handleSingleLayer(item);
                    //子元素有背景色，父子结构大小完全相同-删除父元素
                /* eslint-disable */
                } else if (item.children[0].style.background?.color?.alpha === 1 && 
                    !item.style.borderRadius &&
                    item.children[0].structure.height === item.structure.height &&
                    item.children[0].structure.width === item.structure.width &&
                    item.children[0].structure.x === item.structure.x &&
                    item.children[0].structure.y === item.structure.y
                ) {
                    item = item.children[0];
                    item = handleSingleLayer(item);
                }
                /* eslint-disable */
            }
        }

        //Image
        else if (item.children[0].type == 'Image' && item._class != 'artboard' && !item.style['transform']) {
            //父元素无背景及边框-删除父元素
            if (item.type == 'Container') {
                if (!item.structure.border && !item.style.background) {
                    item = item.children[0];
                    item = handleSingleLayer(item);
                    //子元素与父元素完全相同-删除父元素
                } else if (item.children[0].structure.height === item.structure.height &&
                    item.children[0].structure.width === item.structure.width &&
                    item.children[0].structure.x === item.structure.x &&
                    item.children[0].structure.y === item.structure.y &&
                    !item.style.background
                ) {
                    item = item.children[0];
                    item = handleSingleLayer(item);
                }
            }
        }
        //Text -暂时不处理
        else if (item.children[0].type === 'Text') {
            //父元素无背景及边框-删除父元素
            // if (item.type==Container) {
            //   if (!item.style['border']&&!item.style['background']) {
            //     item =item.children[0];
            //     item= handleSingleLayer(item);
            //   }
            // }
        }
    }
    return item;
}
const handleLayer = (data) => {
    for (let i = 0; i < data.length; i++) {
        data[i] = handleSingleLayer(data[i]);
        if (Array.isArray(data[i].children)) {
            data[i].children = handleLayer(data[i].children);
        }
    }
    return data;
}

export default handleLayer;
