import handleOver from './handleOver'
import handleDelete from './handleDelete'
import { Layer } from '../types'

const recombineTreeDataNew = (data: Layer[]) => {
    let currRecord = data[data.length - 1]
    if (data.length > 1) {
        let preLength = data.length
        for (let i = 0; i < data.length - 1; i++) {
            let record = data[data.length - 2 - i]
            // 父元素被指定的情况
            if (currRecord.parentId) {
                if (currRecord.parentId === record.id) {
                    if (!record.children) {
                        record.children = []
                    }
                    record.children.unshift(
                        JSON.parse(JSON.stringify(currRecord))
                    )
                    data.length = data.length - 1
                    break
                }
            // 包含关系的情况
            } else if (isContain(currRecord, record, data[0])) {
                if (!record.children) {
                    record.children = []
                }
                record.children.unshift(JSON.parse(JSON.stringify(currRecord)))
                data.length = data.length - 1
                break
            }
        }
        if (preLength > data.length) {
            recombineTreeDataNew(data)
        }
    }
    return data
}

const isContain = (target: Layer, container: Layer, artboard: Layer) => {
    if (!target || !container) {
        return false
    }

    // 如果容器是画板，所有元素都被画板包含
    if (container.id === artboard.id) {
        return true
    }

    // 如果是旋转
    if (container.istransformContain) {
        return false
    }

    if (
        target.structure.x <= container.structure.x &&
        target.structure.y <= container.structure.y &&
        target.structure.x + target.structure.width >=
            container.structure.x + container.structure.width &&
        target.structure.y + target.structure.height >=
            container.structure.y + container.structure.height &&
        !(
            target.structure.x == container.structure.x &&
            target.structure.y == container.structure.y &&
            target.structure.x + target.structure.width ==
                container.structure.x + container.structure.width &&
            target.structure.y + target.structure.height ==
                container.structure.y + container.structure.height
        )
    ) {
        return false
    }
    let currTarget = JSON.parse(JSON.stringify(target))
    let curr = handleOver(currTarget, container)
    let targetH = target.structure.height
    if (
        artboard.structure.y + artboard.structure.height - target.structure.y <
        targetH
    ) {
        targetH =
            artboard.structure.y +
            artboard.structure.height -
            target.structure.y
        targetH = targetH < 0 ? 0 : targetH
    }
    if (curr > target.structure.width * targetH * 0.3) {
        return true
    }
    return false
}

export default (data: Layer[], currIndex = { num: 0 }) => {
    // 记录层级标识
    data = data.map((item) => {
        currIndex.num = currIndex.num + 1
        item.structure.zIndex = currIndex.num
        return item
    })
    data = recombineTreeDataNew(data)
    data = handleDelete(data)
    return data
}
