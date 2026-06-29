const Style = require('./Style');
const Structure = require('./Structure');

const PlaceholderStyle = {
  color: '',
  fontSize: '',
  fontWeight: ''
}

module.exports = {
  id: "CF61E2E8-F6C3-4D56-88C0-4B92597268B7",
  type: "滑动选择器",
  value: '输入框的内容',
  isDisabled: false,
  structure: Structure,
  style: Style,
  activeStyle: activeColor,
  min: 0,
  max: 100,
  isShowValue: '是否显示当前 value',
  step: '步长'
}