
const os = require('os');
const path = require('path');

/**
 * 项目执行根路径
 */
const rootPath = process.cwd();

/**
 * sketch资源文件夹路径
 */
const sketchResourcePath = path.resolve(`${rootPath}`, 'input');

/**
 * sketh解析结果文件夹路径
 */
let sketchParseResultPath = path.resolve(`${rootPath}`, 'output');

/**
 * sketchtool路径
 */
const sketchtoolPath = '/Applications/Sketch.app/Contents/Resources/sketchtool/bin/sketchtool';

/**
 * shape图片存放路径
 */
const shapePath = `${sketchParseResultPath}/shapeImage`;

/**
 * 要处理图片存放路径
 */
const handleImageDir = `${sketchParseResultPath}/picasso_handle_images/`;

/**
 * Mac执行环境路径
 */
const homedir = os.userInfo().homedir;

module.exports = {
    rootPath,
    sketchResourcePath,
    sketchParseResultPath,
    sketchtoolPath,
    shapePath,
    homedir,
    handleImageDir
};
