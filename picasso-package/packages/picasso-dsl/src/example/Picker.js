const Style = require('./Style');
const Structure = require('./Structure');
// 选择器类型
const PickerMode = {
  'selector': '普通选择器',
  'multiSelector': '多列选择器',
  'time': '时间选择器',
  'date': '日期选择器',
  'region': '省市区选择器'
}

module.exports = {
  id: "CF61E2E8-F6C3-4D56-88C0-4B92597268B7",
  type: "Picker",
  value: '输入框的内容',
  mode: PickerMode,
  isDisabled: false,
  structure: Structure,
  style: Style
}