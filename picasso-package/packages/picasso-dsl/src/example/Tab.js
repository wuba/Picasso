// Tab 标签页
const Style = require('./Style');
const Structure = require('./Structure');

const TabPanel = {
  structure: Structure,
  style: Style
}

module.exports = {
  id: "CF61E2E8-F6C3-4D56-88C0-4B92597268B7",
  type: "Tab",
  activeName: '', //选中选项卡的 name
  structure: Structure,
  style: Style,
  children: [TabPanel, TabPanel]
}