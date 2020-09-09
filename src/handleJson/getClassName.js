let num = -1;
const classNameArr = require('./classNameList.json');
const classNameSet = new Set(classNameArr);
const classNameList = [...classNameSet];
// 获取class名称
module.exports = () => {
    num++;
    let currIndex = num % classNameList.length;//英文单词下标
    let numIndex = Math.floor(num / classNameList.length) + 1;//数字后缀
    if (numIndex > 1) {
        return classNameList[currIndex] + numIndex;
    }
    return classNameList[currIndex];
}