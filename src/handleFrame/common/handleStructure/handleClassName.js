const  handleClassName = (data, parent = '') => {
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        //最外层的画板
        if (item._class == 'artboard') {
            item.class_name = 'wrapper';
            //画板的子元素
        } else if (parent && parent._class == 'artboard') {
            item.class_name = `section-${i < 26 ? String.fromCharCode(97 + i) : i}`;
        }
        if (Array.isArray(item.children)) {
            item.children = handleClassName(item.children, item);
        }
    }
    return data;
}

module.exports = handleClassName;
