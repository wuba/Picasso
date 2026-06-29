//导航菜单
const Style = require('./Style');
const Structure = require('./Structure');

module.exports = {
  id: "CF61E2E8-F6C3-4D56-88C0-4B92597268B7",
  type: "NavMenu",
  mode: 'horizontal|vertical', // 模式
  collapse: false, // 是否水平折叠收起菜单（仅在 mode 为 vertical 时可用）
  defaultActive: '0', //当前激活菜单的 index
  defaultOpeneds: [], //当前打开的submenu的 key 数组
  menuTrigger: '', // 子菜单打开的触发方式(只在 mode 为 horizontal 时有效) hover
  structure: Structure,
  style: Style
}