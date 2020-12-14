import { Layer } from '../types';
import handleClassName from '../handleClassName';
import { picassoTrans } from '../../../picasso-trans/src';
import { WebScale, Unit, ColorFormat, CodeType } from '../../../sketch-dsl/src';
import generateWXML from './generateWXML';
import generateWXSS from './generateWXSS';



/**
 * @description Picasso生成小程序代码
 * @param {Layer[]} data
 * @param {string} outputPath 生成代码存放路径
 */
export const picassoWeappCodeFile = (data:Layer[], outputPath:string) => {
    const fs = require('fs');
    const path = require('path');
    /**
     * 删除文件夹
     * @param {String} dir 要删除的文件夹
     */
    const removeDir = (dir: string) => {
        let files = fs.readdirSync(dir)
        for (var i = 0; i < files.length; i++) {
            let newPath = path.join(dir, files[i]);
            let stat = fs.statSync(newPath)
            if (stat.isDirectory()) {
                //如果是文件夹就递归下去
                removeDir(newPath);
            } else {
                //删除文件
                fs.unlinkSync(newPath);
            }
        }
        //如果文件夹是空的，就将自身删除掉
        fs.rmdirSync(dir);
    }
    /**
     * 
     * 递归创建文件目录
     * @param dirname 目录路径
     */
    const mkdirsSync = (dirname) => {  
        if (fs.existsSync(dirname)) {  
            return true;  
        } else {  
            if (mkdirsSync(path.dirname(dirname))) {  
                fs.mkdirSync(dirname);  
                return true;  
            }  
        }  
    }
    const size = data[0].structure.width;
    // class名称处理
    data = handleClassName(data);
    // 4. 样式处理
    data = picassoTrans(data, {
        scale: WebScale.Points,
        unit: Unit.Weapp,
        colorFormat: ColorFormat.RGBA,
        codeType: CodeType.Weapp
    });
    //生成wxml模板
    const wxmlCode = generateWXML(data);
    //生成wxss代码
    const wxssCode = generateWXSS(data,size);

    // 开始输出解析结果
    if (fs.existsSync(outputPath)) {
        removeDir(outputPath);
    }

    mkdirsSync(outputPath);

    // 写入生成的样式
    fs.writeFileSync(`${outputPath}/index.wxss`, wxssCode)
    fs.writeFileSync(
        `${outputPath}/index.wxml`,
        `<block>${wxmlCode}</block>`
    )
}

/**
 * @description Picasso生成小程序代码
 * @param {Layer[]} data
 * @param { number } size 画板宽度
 */
export const picassoWeappCode = (data:Layer[], size: number) => {
    // class名称处理
    data = handleClassName(data);
    // 样式处理
    data = picassoTrans(data, {
        scale: WebScale.Points,
        unit: Unit.Weapp,
        colorFormat: ColorFormat.RGBA,
        codeType: CodeType.Weapp
    });
    //生成wxml模板
    const wxml = generateWXML(data);
    //生成wxss代码
    const wxss = generateWXSS(data,size);

    return {
        wxml,
        wxss
    }
}
