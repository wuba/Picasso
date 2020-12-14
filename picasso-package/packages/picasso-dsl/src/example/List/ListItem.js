const Style = require('../Style');
const Structure = require('../Structure');
const Image = require('../Image')
const Title = require('../Title')
const Text = require('../Text')
const Link = require('../Link')

module.exports = {
  id: "CF61E2E8-F6C3-4D56-88C0-4B92597268B7",
  type: "ListItem",
  structure: Structure,
  style: Style,
  children: [Image, Title, Text, Link, '...']
}