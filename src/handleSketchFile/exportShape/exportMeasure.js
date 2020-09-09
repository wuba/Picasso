const fs = require('fs');
const path = require('path');
const child = require('child_process');
const fileSystem = require('file-system');

const { sketchtoolPath, homedir } = require('../../common/path');

module.exports = (sketchPath) => {
    return new Promise((resolve,reject)=>{
        try {
        /* eslint-disable */
        const filePath = `${homedir}/Library/Application\ Support/com.bohemiancoding.sketch3/Plugins/picassoImg.sketchplugin/Contents/Sketch/picassoImg.js`
        /* eslint-disable */
        let data = fs.readFileSync(path.resolve(__dirname, 'openSketchTemplate.js'), 'utf-8');
        let fileCon = data.replace('$sketchPath$',sketchPath);
        fs.writeFileSync(filePath, fileCon, 'utf-8');
        let sketchDir = sketchPath.slice(0,-7);
        if (fs.existsSync(sketchDir)) {
            fileSystem.rmdirSync(sketchDir);
        }
        //防止异常发生
        try {
            child.execSync(`killall Sketch`);
        } catch (error) {
            // //console.log(error);
        }
        child.execSync(`${sketchtoolPath} run ${homedir}/Library/Application\\ Support/com.bohemiancoding.sketch3/Plugins/picassoImg.sketchplugin ""`);
        child.exec(`${sketchtoolPath} run ${homedir}/Library/Application\\ Support/com.bohemiancoding.sketch3/Plugins/Sketch\\ Measure.sketchplugin "commandExport"`);
        let num =0;
        let timeFlag = setInterval(() => {
            if (num>20) {
            clearInterval(timeFlag);
            reject({msg:'导出超时'});
            }
            num++;
            // //console.log('标注稿路径',`${sketchDir}/index.html`);
            if(fs.existsSync(`${sketchDir}/index.html`)) {
            clearInterval(timeFlag);
            //console.log('导出成功,杀掉进程');
            //图片提取完毕后杀掉sketch;
            try {
                child.execSync(`killall Sketch`);
            } catch (error) {
                //console.log(error);
            }
            resolve(sketchDir);
            }
        },3000);
        } catch (error) {
        reject(error);
        }
    })

}
