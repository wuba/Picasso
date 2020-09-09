

/**
 * 截取artboard的父图层超出artboard的
 *  画板父图层有背景图或者背景色的时候删掉画板背景色 防止遮挡
 * @param {*} data
 * @returns
 */
const handleArtboardParents = (data) => {
    let parentIndexList = []; //父元素索引数组
    let artboardFrame = {}; //画板
    /**
     * 获取画板父元素索引队列
     *
     * @param {*} data
     * @param {*} [parents=[]]
     * @returns
     */
    const getArtboardParents = (data, parents = []) => {
        for (let index = 0; index < data.length; index++) {
            const item = data[index];
            if (item._class == 'artboard') {
                parentIndexList = parents;
                artboardFrame = item;
                return;
            }
            if (Array.isArray(data[index].children) && data[index].children.length > 0) {
                parents.push(index);
                getArtboardParents(data[index].children, JSON.parse(JSON.stringify(parents)));
            }
        }
    }
    getArtboardParents(data);
    if (parentIndexList.length > 0) {
        let currParent = data[parentIndexList[0]];
        for (let i = 0; i < parentIndexList.length; i++) {
            if (i >= 1) {
                currParent = currParent['children'][parentIndexList[i]];
            }
            if (currParent.type && currParent.type == 'Image') {
                currParent.isMask = true;
                currParent.style = {
                    ...currParent.style,
                    'background-position': `${currParent.x - artboardFrame.x}px ${currParent.y - artboardFrame.y}px`,
                    'background-size': `${currParent.width}px ${currParent.height}px`,
                    "background-repeat": 'no-repeat'
                }
                //删除artboard背景色，防止遮挡
                delete artboardFrame.style['background'];
            } else if (currParent.style['background'] && currParent.style['background'] != 'none') {
                //删除artboard背景色，防止遮挡
                delete artboardFrame.style['background'];
            }
            currParent.x = artboardFrame.x;
            currParent.y = artboardFrame.y;
            currParent.width = artboardFrame.width;
            currParent.height = artboardFrame.height;
        }
    }
    return data;
}
module.exports = handleArtboardParents;