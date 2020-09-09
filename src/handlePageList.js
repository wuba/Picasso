const fs = require('fs');

/**
 * 在document里获取pages列表 
 * 
 * @param {String} folderPath sketch解压后文件夹路径
 */
function readPagesFromDocument(folderPath) {
    let result = [],
        data = fs.readFileSync(folderPath + '/document.json').toString();

    if (data) {
        data = JSON.parse(data);

        if (data.pages) {
            data.pages.forEach(function (record) {
                result.push({
                    path: folderPath + '/' + record._ref + '.json'
                });
            });
        }
    }

    return result;
}

/**
 * 根据pages路径获取pages json数据
 * @param {String} pages pages路径列表
 */
function readDataFromPages(pages) {
    const data = [];

    pages.forEach(function (record) {
        let pageData = fs.readFileSync(record.path).toString();
        if (pageData) {
            pageData = JSON.parse(pageData);
            data.push(pageData);
        }
    });

    return data;
}

/**
 * 在解压后的文件中提取pagesJson
 * 
 * @param {String} sketchId
 * @param {String} sketchName
 * @param {String} artboardIndex
 */
module.exports = (sketchId, sketchName, artboardIndex) => {
    const cliSketchParseResultPath = global.globalPath.cliSketchParseResultPath;

    const unzipFolderPath = `${cliSketchParseResultPath}/${sketchId}_${artboardIndex}`;

    return readDataFromPages(readPagesFromDocument(unzipFolderPath));
}
