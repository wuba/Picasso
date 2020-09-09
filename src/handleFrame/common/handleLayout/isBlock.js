// 判断是横向还是纵向排列
// 只有满足同级下所有的元素都是纵向才认为是纵向排列， 否则都认为是横向排列
const isBlock = (data1) => {
    let data = JSON.parse(JSON.stringify(data1));
    for (var i = 1; i < data.length; i++) {
        //计算的值误差范围
        if (+data[i].x - data[i - 1].width - data[i - 1].x > 0) {
            // 表示的是横向排列的
            return false
        }
    }
    return true;
}

module.exports = isBlock;
