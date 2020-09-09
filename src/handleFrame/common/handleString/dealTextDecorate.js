// 处理文字转换问题
module.exports = (attributes) => {
    // MSAttributedStringTextTransformAttribute  0： 原格式展示 1： 转大小  2: 转小写
    try {
        let retObj = {};
        // 文字大小写转换
        if (attributes.MSAttributedStringTextTransformAttribute == 1) {
            retObj['text-transform'] = `uppercase`
        }
        if (attributes.MSAttributedStringTextTransformAttribute == 2) {
            retObj['text-transform'] = `lowercase`
        }

        if (attributes.underlineStyle == 1) {
            retObj['text-decoration'] = 'underline';
        }

        if (attributes.strikethroughStyle == 1) {
            retObj['text-decoration'] = 'line-through';
        }

        return retObj;
    } catch (error) {
        console.log(error);
        return {};
    }
}
