
const PLATFORM = {
    'pc': '1',
    'm': '2'
}

const SKETCH_STATUS = {
    'SUCCESS': '1',
    'FAIL': '2'
}

const ARTBOARD_STATUS = {
    'UNSTART': '1', // 未解析
    'SUCCESS': '2', // 解析成功
    'FAIL': '3' // 解析失败
}

const CLASSNAME_TYPE = {
    'WORD': '1',
    'RANDOM': '2'
}

const MEASURE_STATUS = {
    "NONE": 1,
    "UNSTART": 2,
    "SUCCESS": 3,
    "FAIL": 4
}

const CLASS_TYPE = {
    "NORMAL": 1, // 普通的className
    "RELY_ON_PARENT": 2, // 子元素className依赖父元素
    "RELY_ON_CHILD_AND_PARENT": 3, // 子元素className依赖父元素,且父元素也要特殊设置
}

const PAGE_TYPE = {
    "NORMAL": 1, // 普通业务页面(高可用度)
    "ACTIVITY": 2, // 运营活动页面(极高还原度)
}

const IMG_SCALE = {
    "X1": 1, // 一倍图
    "X1D5": 1.5, // 1.5倍图
    "X2": 2, // 二倍图
    "X3": 3, // 三倍图
}

const IMG_SCALE_UNIT = {
    1: '', // 一倍图
    1.5: '@1x', // 1.5倍图
    2: '@2x', // 二倍图
    3: '@3x', // 三倍图
}

module.exports = {
    PLATFORM,
    SKETCH_STATUS,
    CLASSNAME_TYPE,
    ARTBOARD_STATUS,
    MEASURE_STATUS,
    CLASS_TYPE,
    PAGE_TYPE,
    IMG_SCALE,
    IMG_SCALE_UNIT,
}
