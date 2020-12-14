/**
 * 判断是否有包含或者重叠
 *
 * @param {*} target
 * @param {*} container
 * @returns
 */
const isContain = (target, container) => {
    if (!target.frame || !container.frame) {
        return false;
    }
    target = target.frame;
    container = container.frame;
    let targetLeft = target.x,
        targetRight = target.x + target.width,
        targetTop = target.y,
        targetBottom = target.y + target.height,
        containerLeft = container.x,
        containerRight = container.x + container.width,
        containerTop = container.y,
        containerBottom = container.y + container.height;
    if (((targetLeft >= containerLeft) && (targetTop >= containerTop)) &&
        ((targetRight <= containerRight) && (targetBottom <= containerBottom))) {
        return true;
    }
    return false;
};
export default isContain;
