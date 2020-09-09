// 处理字间距
module.exports = kerning => {
    try {
        let retObj = {};
        if (kerning != undefined && kerning != 0) {
            retObj["letter-spacing"] = Math.round(kerning * 10) / 10;
        }
        return retObj;
    } catch (error) {
        console.log(error);
        return {};
    }
};
