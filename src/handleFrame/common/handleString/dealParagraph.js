// 处理段落
module.exports = (paragraphStyle = {}) => {
    try {
        // 0 left 、1 right 、2 center 、3 justify
        let retObj = {};
        switch (paragraphStyle.alignment) {
        case 2:
            retObj['text-align'] = 'center';
            break;
        case 1:
            retObj['text-align'] = 'right';
            break;
        case 0:
            retObj['text-align'] = 'left';
            break;
        case 3: //两边对齐
            retObj['text-align'] = 'justify';
            break;
        }
        if (paragraphStyle.maximumLineHeight) {
            retObj['line-height'] = paragraphStyle.maximumLineHeight
        }
        return retObj;
    } catch (error) {
        console.log(error);
        return {};
    }
}
