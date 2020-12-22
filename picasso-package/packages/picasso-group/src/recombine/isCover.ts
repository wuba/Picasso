import { Layer } from '../types'
/**
 * 判断包含关系
 * @param {*} target
 * @param {*} contain
 */
const isCover = (target: Layer, contain: Layer) => {
  if (target.structure.x <= contain.structure.x &&
    target.structure.y <= contain.structure.y &&
    target.structure.x + target.structure.width >= contain.structure.x + contain.structure.width &&
    target.structure.y + target.structure.height >= contain.structure.y + contain.structure.height &&
    !(  target.structure.x == contain.structure.x &&
        target.structure.y == contain.structure.y &&
        target.structure.x + target.structure.width == contain.structure.x + contain.structure.width &&
        target.structure.y + target.structure.height == contain.structure.y + contain.structure.height
    )
  ) {
    return true;
  }
  return false;
}

export default isCover;
