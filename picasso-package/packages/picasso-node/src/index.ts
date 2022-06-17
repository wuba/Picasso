import * as fs from 'fs';
import * as path from 'path'

const zipper = require('zip-local');
const basePath = path.join(__dirname, '../sketch');
const documentPath = `${basePath}/document`;
const symbolPath = `${basePath}/symbol`;
const pagesPath = `${basePath}/pages`;
const artboardPath = `${basePath}/artboard`;
                                
if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath);
}
if (!fs.existsSync(documentPath)) {
    fs.mkdirSync(documentPath);
}
if (!fs.existsSync(symbolPath)) {
    fs.mkdirSync(symbolPath);
}
if (!fs.existsSync(pagesPath)) {
    fs.mkdirSync(pagesPath);
}
if (!fs.existsSync(artboardPath)) {
    fs.mkdirSync(artboardPath);
}

// 递归解绑
export const detachSymbolInstance = (symbolChildItem) => {
    symbolChildItem = JSON.parse(JSON.stringify(symbolChildItem));

    const { layers, symbolID, name } = symbolChildItem;
    console.log('=========', symbolID, name)

    layers.forEach(symbolItem => {
        console.log('+++++++', symbolItem.name)
        if ( // 是 symbolInstance 类型则用解绑后的元素替换
            (symbolItem._class === 'symbolMaster' || symbolItem._class === 'symbolInstance')
            && (!symbolItem.layers || !symbolItem.layers.length)
            && symbolItem.symbolID
        ) {
            const symbolChild = fs.readFileSync(`${symbolPath}/${symbolItem.symbolID}.json`, 'utf-8');
            detachSymbolInstance(symbolChild);
        } else {
            if (symbolItem?.layers?.length) {
                detachSymbolInstance(symbolItem);
            }
        }
    })

    console.log('>>>>>>>>>>>>>', symbolChildItem.symbolID);

    // 递归解绑结束
    if (symbolChildItem?.symbolID && (symbolChildItem._class === 'symbolMaster' || symbolChildItem._class === 'symbolInstance')) {
        createSymbolInstanceFile(symbolChildItem);
    }
}

// 创建解绑后的文件
const createSymbolInstanceFile = (symbolItem) => {
    if (symbolItem?.symbolMaster?.symbolID) {
        fs.writeFileSync(`${symbolPath}/detach_${symbolItem.symbolMaster.symbolID}.json`, JSON.stringify(symbolItem.symbolMaster));
    }
}

/**
 * @description Picasso node环境
 * @param filePath sketch文件路径
 * 
 */
export const picassoArtboardFileCreate = (filePath: string) => new Promise(async () => {
    await sketchToJson(filePath);
    // 生成 artboard 画板文件
    fs.readdir(pagesPath, (err, files) => {
        if(err) {
            console.warn(err)
        } else {
            //遍历读取到的文件列表
            files.forEach((filename) => {
                //获取当前文件的绝对路径
                let filedir = path.join(pagesPath, filename);
                //根据文件路径获取文件信息，返回一个fs.Stats对象
                fs.stat(filedir, (eror, stats) => {
                    if(eror){
                        console.warn('获取文件 artboard stats 失败');
                    } else {
                        let isFile = stats.isFile();//是文件
                        let isDir = stats.isDirectory();//是文件夹
                        if(isFile){
　　　　　　　　　　　　　　　　　// 读取文件内容
                            let content = fs.readFileSync(filedir, 'utf-8');
                            const pages = JSON.parse(content);
                            if (pages?.layers?.length) {
                                pages.layers.forEach(layer => {
                                    if (layer._class === 'artboard') {
                                        // console.log('----------------------------------------');
                                        // console.log(layer);
                                        fs.writeFileSync(`${artboardPath}/${layer.do_objectID}.json`, JSON.stringify(layer));
                                    }
                                });
                            }
                        }
                    }
                })
            });
        }
    });

    // 在document中获取 symbolInstance 文件
    const documentFilePath = `${basePath}/document.json`;
    // 读取文件内容
    const documentStr = fs.readFileSync(documentFilePath, 'utf-8');
    const documentContent = JSON.parse(documentStr);
    const { foreignSymbols } = documentContent;
    // 生成 Symbol 文件
    if (foreignSymbols?.length) {
        foreignSymbols.forEach(symbolItem => {
            if (symbolItem?.symbolMaster?.symbolID) {
                fs.writeFileSync(`${documentPath}/${symbolItem.symbolMaster.symbolID}.json`, JSON.stringify(symbolItem.symbolMaster));
            }
        });
    }

    // Symbol 文件嵌套解绑
    fs.readdir(documentPath, (err, files) => {
        if(err) {
            console.warn(err)
        } else {
            files.forEach((filename) => {
                let filedir = path.join(documentPath, filename);
                fs.stat(filedir, (eror, stats) => {
                    if(eror){
                        console.warn('嵌套解绑：获取文件 Symbol stats 失败');
                    } else {
                        let isFile = stats.isFile();//是文件
                        if(isFile){
　　　　　　　　　　　　　　　　　// 读取文件内容
                            let symbolStr = fs.readFileSync(filedir, 'utf-8');
                            const symbolContent = JSON.parse(symbolStr);
                            console.log('++++++++', symbolContent.symbolID)
                            detachSymbolInstance(symbolContent);
                        }
                    }
                })
            });
        }
    });
})

/**
 * @description Sketch => Json
 */
export const sketchToJson = async(filePath: string) => {
    const buff = Buffer.from(fs.readFileSync(filePath));

    fs.writeFileSync(filePath, buff);
    zipper.sync.unzip(filePath).save(`${basePath}`);
}
