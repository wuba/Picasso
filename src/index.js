/*
 * @Author: iChengbo
 * @Date: 2020-12-17 10:04:12
 * @LastEditors: iChengbo
 * @LastEditTime: 2020-12-17 14:28:16
 * @FilePath: /Picasso/src/index.js
 */
import UI from 'sketch/ui';
import { Document } from 'sketch/dom';
import { parseDocument } from './parseArtboard/index';

const _ = (str) => str.replace(/\%\@/gi, '');

/**
 * 获取解析结果存放路径
 * @param {String} fileName sketch设计稿名称作为生成代码存放根文件夹
 */
const getSavePath = (fileName) => {
    // 打开保存面板
    const savePanel = NSSavePanel.savePanel();

    savePanel.setTitle(_("Export code"));
    savePanel.setNameFieldLabel(_("Export to:"));
    savePanel.setPrompt(_("Export"));
    savePanel.setCanCreateDirectories(true);
    savePanel.setNameFieldStringValue(fileName);

    if (savePanel.runModal() != NSOKButton) {
        return '';
    }

    return savePanel.URL().path();
}

<<<<<<< HEAD:src/index.js
const parseArtboard = (type, codeType) => {
=======
const parseArtboard = (type, platform) => {
>>>>>>> 0814b8c36402e0c82b4cb19b238bbf50d18ca1e5:picasso-plugin/src/index.js

    const document = Document.getSelectedDocument();

    // 获取不到sketch源文件
    if (!document.path) {
        return UI.message('请先保存文件，再进行解析！');
    }

    const fileName = document.sketchObject.displayName().stringByDeletingPathExtension();

    // console.log('fileName', fileName);
    // 代码存储根目录
    const rootPath = getSavePath(fileName);

    // console.log('rootPath', rootPath);
    if (rootPath === '') {
        return UI.message('取消解析');
    }
    UI.message(`当前进度：0%`);
    setTimeout(() => {
<<<<<<< HEAD:src/index.js
        parseDocument(type, codeType, rootPath, (progress) => {
=======
        parseDocument(type, platform, rootPath, (progress) => {
>>>>>>> 0814b8c36402e0c82b4cb19b238bbf50d18ca1e5:picasso-plugin/src/index.js
            // console.log('当前进度：', progress);
            UI.message(`当前进度：${+((progress*100).toFixed(4))}%`);
        }).then((res) => {
            // console.log('解析完成：', res);
            UI.message('解析完成！');
            // 解析完成，打开结果文件目录
            NSWorkspace.sharedWorkspace().activateFileViewerSelectingURLs([NSURL.fileURLWithPath(`${rootPath}/${res[0]&&res[0].name}`)]);
        }).catch((err) => {
            // console.log('解析失败', err);
            UI.message('解析失败！');
        });
    },0);
    
}

export const parseSelectArtboard = () => {
    parseArtboard(1,0);
}

export const parseAllArtboard = () => {
    parseArtboard(2,0);
}

export const parseSelectArtboardOperation = () => {
    parseArtboard(1,1);
}

export const parseAllArtboardOperation = () => {
    parseArtboard(2,1);
}
// 小程序
export const parseSelectArtboardWeapp = () => {
    parseArtboard(1,2);
}

export const parseAllArtboardWeapp = () => {
    parseArtboard(2,2);
}

// ReactNative
export const parseSelectArtboardRN = () => {
    parseArtboard(1,3);
}

export const parseAllArtboardRN = () => {
    parseArtboard(2,3);
}

export const parseRNSelectArtboard = () => {
    parseArtboard(1, 'rn');
}

export const parseRNAllArtboard = () => {
    parseArtboard(2, 'rn');
}

export const help = () => {
    NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString('https://github.com/wuba/Picasso'));
}
