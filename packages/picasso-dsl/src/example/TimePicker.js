const Style = require('./Style');
const Structure = require('./Structure');
const PlaceholderStyle = require('../PlaceholderStyle')

module.exports = {
  id: "CF61E2E8-F6C3-4D56-88C0-4B92597268B7",
  type: "TimePicker",
  isDisabled: false,
  isReadonly: false,
  isEditable: '文本框可输入',
  isClearable: '是否显示清除按钮',
  placeholder: '请选择日期',
  placeholderStyle: PlaceholderStyle,
  type: 'year/month/date/week/ datetime/datetimerange/daterange',
  rangeSeparator: '-', //选择范围时的分隔符
  defaultValue: new Date(),
  timeSelect: {
    start: '09:00',  // 开始时间
    end: '18:00', // 结束时间
    step: '00:30', // 间隔时间
    minTime: '00:00', // 最小时间，小于该时间的时间段将被禁用
    maxTime: '',//	最大时间，大于该时间的时间段将被禁用
  },
  timePicker: {
    selectableRange: '', //可选时间段，例如'18:30:00 - 20:30:00'或者传入数组['09:30:00 - 12:00:00', '14:30:00 - 18:30:00']
    format: 'HH:mm:ss'
  },
  structure: Structure,
  style: Style
}