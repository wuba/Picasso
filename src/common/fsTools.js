const fs = require('fs');
const fileSystem = require('file-system');
const process = require('child_process');

module.exports = {
    /**
     * 删除文件
     *
     * @param {String} path 文件路径
     * 
     */
    deleteFile(path) {
        if (fs.existsSync(path)) {
            fs.unlinkSync(path);
            return true;
        }
        return false;
    },
    /**
     * 删除文件夹
     *
     * @param {String} path 文件夹路径
     */
    deleteDir(path) {
        if (fs.existsSync(path)) {
            fileSystem.rmdirSync(path);
        }
    },
    /**
     * 创建文件夹
     * @param {String} path 文件夹路径
     */
    addDir(path) {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
    },
    /**
     * 清空文件夹内部全部内容
     * @param {String} path
     */
    clearDir(path) {
        if (path != '*') {
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path);
            } else {
                /**
                 * 必须是已有的文件夹脚本才能执行
                 */
                process.execSync(`rm -rf ${path}/*`);
            }
        }
    }
}