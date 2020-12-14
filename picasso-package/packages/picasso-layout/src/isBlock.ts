import { Layer } from './types';
// 判断是横向还是纵向排列
// 只有满足同级下所有的元素都是纵向才认为是纵向排列， 否则都认为是横向排列
const isBlock = (data:Layer[]) => {
    for (var i = 1; i < data.length; i++) {
        //计算的值误差范围
        if (+data[i].structure.x - data[i - 1].structure.width - data[i - 1].structure.x > 0) {
            // 表示的是横向排列的
            return false
        }
    }
    return true;
}

export default isBlock;
