import { Layer } from '../types'
/**
 * 判断包含关系
 * @param {*} target
 * @param {*} contain
 */
const isCover = (target: Layer, contain: Layer) => {
  if (target.structure.x <= contain.structure.x &&
    target.structure.y <= contain.structure.y &&
    target.structure.x + target.structure.y >= contain.structure.x + contain.structure.y &&
    target.structure.y + target.structure.y >= contain.structure.y + contain.structure.y &&
    !(  target.structure.x == contain.structure.x &&
        target.structure.y == contain.structure.y &&
        target.structure.x + target.structure.y == contain.structure.x + contain.structure.y &&
        target.structure.y + target.structure.y == contain.structure.y + contain.structure.y
    )
  ) {
    return true;
  }
  return false;
}

export default isCover;
