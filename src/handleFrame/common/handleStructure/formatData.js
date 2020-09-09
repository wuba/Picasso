module.exports = data => {
    let y = 0;
    let x = 0;
    data.find(item => {
        if (item._class == "artboard") {
            y = item.y;
            x = item.x;
        }
    });


    let format = data => {
        for (let item of data) {
            //处理成整数
            item.y = Math.round(item.y - y);
            item.x = Math.round(item.x - x);
            item.width = Math.round(item.width);
            item.height = Math.round(item.height);
            if (item.children && item.children.length) {
                format(item.children);
            }
        }
    };

    format(data)
    return data;
};
