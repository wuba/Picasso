// 级联选择器
const Style = require('./Style');
const Structure = require('./Structure');

module.exports = {
  id: "CF61E2E8-F6C3-4D56-88C0-4B92597268B7",
  type: "Cascader",
  isClearable: false, //是否支持清空选项
  isDisabled: false,
  isFilterable: false, // 是否可搜索选项
  structure: Structure,
  style: Style,
  placehodler: '请选择',
  placeholderStyle: PlaceholderStyle,
  value: "标题"
}