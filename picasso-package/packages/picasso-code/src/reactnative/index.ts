/*
 * @Author: iChengbo
 * @Date: 2020-09-02 11:33:23
 * @LastEditors: iChengbo
 * @LastEditTime: 2020-12-17 17:26:14
 * @FilePath: /Picasso/picasso-package/packages/picasso-code/src/reactnative/index.ts
 */
import { Layer } from '../types';
import handleClassName from '../handleClassName';
import { picassoTrans } from '../../../picasso-trans/src';
import { WebScale, Unit, ColorFormat, CodeType } from '../../../sketch-dsl/src';
import { generateRNJSX } from './generateJSX';
import { generateRNStyle } from './generateStyle';

/**
 * @description Picasso生成代码
 * @param {Layer[]} data
 * @param {string} outputPath 生成代码存放路径
 */
export const picassoRNCodeFile = (data: Layer[], outputPath: string) => {
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

    try {
        // class 名称处理
        data = handleClassName(data);

        // 4. 样式处理
        data = picassoTrans(data, {
            scale: WebScale.Points,
            unit: Unit.ReactNative,
            colorFormat: ColorFormat.RGBA,
            codeType: CodeType.ReactNative
        });
        // console.log("哈哈哈哈哈\n",  JSON.stringify(data, null, 2))
        // 生成组件
        const jsxCode = generateRNJSX(data);
        // console.log("生成的组件：", jsxCode)
        // 生成样式
        const styleCode = generateRNStyle(data);
        // 开始输出解析结果
        if (fs.existsSync(outputPath)) {
            removeDir(outputPath);
        }

        fs.mkdirSync(outputPath);
        // 写入模板
        fs.writeFileSync(
            // './test/reactNative/output/index.js',
            `${outputPath}/App.js`,
            `import React, { Component } from 'react';
import {
    Image,
    View,
    Text,
    ImageBackground,
    ScrollView,
    Dimensions,
    StyleSheet,
    SafeAreaView,
    Platform,
    StatusBar,
    PixelRatio,
} from 'react-native';
${/LinearGradient/.test(jsxCode) ? "import LinearGradient from 'react-native-linear-gradient';" : ""}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const scaleSize = (size) => PixelRatio.roundToNearestPixel(size * (SCREEN_WIDTH / 750));

const isIphoneX = () => {
    return Platform.OS === 'ios' &&
        !Platform.isPad &&
        !Platform.isTVOS &&
        (SCREEN_HEIGHT === 812 || SCREEN_WIDTH === 812 || SCREEN_WIDTH === 896 || SCREEN_HEIGHT === 896);
}
  
const STATUSBAR_HEIGHT = Platform.select({
    ios: isIphoneX() ? 44 : 20,
    android: StatusBar.currentHeight,
})

export default class PicassoPage extends Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {}

    componentWillUnmount() {}

    render() {
        return (
            <ScrollView style={{ flex: 1, width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
                ${jsxCode}
            </ScrollView>
        )
    }
}

const styles = StyleSheet.create(${styleCode})
`
        );
        console.log("Picasso 生成 React-Native 成功：", `${outputPath}/App.js`);
    } catch (error) {
        console.log("Picasso 生成 React-Native 失败：", error);
    }
}

/**
 * @description Picasso生成代码
 * @param { Layer[] } data
 * @param { number } size 画板宽度
 */
export const picassoRNCode = (data: Layer[], size: number) => {
    // class 名称处理
    data = handleClassName(data);

    // 4. 样式处理
    data = picassoTrans(data, {
        scale: WebScale.Points,
        unit: Unit.ReactNative,
        colorFormat: ColorFormat.RGBA,
        codeType: CodeType.ReactNative
    });
    // 生成组件
    const jsxCode = generateRNJSX(data);
    // console.log("生成的组件：", jsxCode)
    // 生成样式
    const styleCode = generateRNStyle(data);

    return {
        jsx: `import React, { Component } from 'react';
        import {
            Image,
            View,
            Text,
            ImageBackground,
            ScrollView,
            Dimensions,
            StyleSheet,
            SafeAreaView,
            Platform,
            StatusBar,
            PixelRatio,
        } from 'react-native';
        ${/LinearGradient/.test(jsxCode) ? "import LinearGradient from 'react-native-linear-gradient';" : ""}
        
        const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
        
        const scaleSize = (size) => PixelRatio.roundToNearestPixel(size * (SCREEN_WIDTH / ${size}));
        const isIphoneX = () => {
            return Platform.OS === 'ios' &&
                !Platform.isPad &&
                !Platform.isTVOS &&
                (SCREEN_HEIGHT === 812 || SCREEN_WIDTH === 812 || SCREEN_WIDTH === 896 || SCREEN_HEIGHT === 896);
        }
            
        const STATUSBAR_HEIGHT = Platform.select({
            ios: isIphoneX() ? 44 : 20,
            android: StatusBar.currentHeight,
        })
        
        export default class PicassoPage extends Component {
            constructor(props) {
                super(props);
            }
        
            componentDidMount() {}
        
            componentWillUnmount() {}
        
            render() {
                return (
                    <ScrollView style={{ flex: 1, width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
                        ${jsxCode}
                    </ScrollView>
                )
            }
        }
        
        const styles = StyleSheet.create(${styleCode})
        `
    };
}
