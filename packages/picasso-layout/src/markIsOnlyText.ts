import { Layer } from './types';

// 根据盒子的内容删减没必要的盒子，以适应基本的布局的需要
const markIsOnlyText = (data: Layer[], parent: Layer) => {
    for (var i = 0; i < data.length; i++) {
        if (!data[i].children && parent.children.length == 1) {
            if (data[i].type == 'Text') {
                parent.isOnlyText = true;
            }
        }
        if (data[i].children) {
            markIsOnlyText(data[i].children, data[i])
        }
    }
    return data;
}

export default markIsOnlyText;
