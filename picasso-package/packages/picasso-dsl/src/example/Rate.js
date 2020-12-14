// 评分组件
const Style = require('./Style');
const Structure = require('./Structure');

module.exports = {
  id: "CF61E2E8-F6C3-4D56-88C0-4B92597268B7",
  type: "Rate",
  max: '5', // 最大分值
  isDisabled: false, // 是否为只读
  allowHalf: false, // 是否允许半选
  voidColor: '', //未选中 icon 的颜色
  disabledVoidColor: '', // 只读时未选中 icon 的颜色
  isShowText: false, //是否显示辅助文字
  textStyle: Style,
  texts: ['极差', '失望', '一般', '满意', '惊喜'], // 辅助文字数组
  structure: Structure,
  style: Style,
  value: "标题"
}