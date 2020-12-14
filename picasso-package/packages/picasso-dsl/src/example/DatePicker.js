const Style = require('./Style');
const Structure = require('./Structure');
const PlaceholderStyle = require('../PlaceholderStyle')

module.exports = {
  id: "CF61E2E8-F6C3-4D56-88C0-4B92597268B7",
  type: "DatePicker",
  isDisabled: false,
  isReadonly: false,
  isEditable: '文本框可输入',
  isClearable: '是否显示清除按钮',
  placeholder: '请选择日期',
  placeholderStyle: PlaceholderStyle,
  type: 'year/month/date/week/ datetime/datetimerange/daterange',
  format: 'yyyy-MM-dd',
  rangeSeparator: '-', //选择范围时的分隔符
  defaultValue: new Date(),
  structure: Structure,
  style: Style
}