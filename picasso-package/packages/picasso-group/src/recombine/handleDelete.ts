import isCover from './isCover'
import { Layer } from '../types'

/**
 * 反向覆盖的元素则进行定位处理
 */
const handleDelete = (data: Layer[]) => {
    for (let i = 0; i < data.length; i++) {
        const currItemI = data[i]
        // if (currItemI.width <= 1) {
        //     console.log(1111)
        //   currItemI.isPosition = true;
        // }

        for (let j = i; j < data.length; j++) {
            const currItemJ = data[j]

            if (
                currItemI.structure.zIndex > currItemJ.structure.zIndex &&
                isCover(currItemI, currItemJ)
            ) {
                if (currItemI.style?.background?.color?.alpha === 1) {
                    currItemJ.isDelete = true
                }
                // if (!currItemI.isPosition) {
                //   currItemI.isPosition = true;
                // }
            } else if (
                currItemI.structure.zIndex < currItemJ.structure.zIndex &&
                isCover(currItemJ, currItemI)
            ) {
                if (currItemJ.style?.background?.color?.alpha === 1) {
                    currItemI.isDelete = true
                }
                // if (!currItemJ.isPosition) {
                //   currItemJ.isPosition = true;
                // }
            }
            //   else if(j!=i&&handleOver(JSON.parse(JSON.stringify(currItemI)),currItemJ)>0){
            //     if (currItemI.structure.zIndex >currItemJ.structure.zIndex ) {
            //         console.log(4111)
            //       currItemI.isPosition = true;
            //     }else{
            //         console.log(5111)
            //       currItemJ.isPosition = true;
            //     }
            //   }
        }
    }
    // 去掉需要删除的
    data = data.filter((item) => !item.isDelete)
    //递归处理children
    for (let i = 0; i < data.length; i++) {
        if (Array.isArray(data[i].children) && data[i].children.length > 0) {
            data[i].children = handleDelete(data[i].children)
        }
    }
    return data
}

export default handleDelete
