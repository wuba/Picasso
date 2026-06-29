const Style = require('./Style');
const Structure = require('./Structure');
const Switch = require('./Switch')
const InputText = require('./InputText')

module.exports = {
  id: "CF61E2E8-F6C3-4D56-88C0-4B92597268B7",
  type: "Form",
  structure: Structure,
  style: Style,
  children: [Switch, InputText]
}