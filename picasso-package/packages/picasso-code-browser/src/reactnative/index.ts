/*
 * @Author: iChengbo
 * @Date: 2020-09-02 11:33:23
 * @LastEditors: iChengbo
 * @LastEditTime: 2020-12-24 15:10:07
 * @FilePath: /Picasso/picasso-package/packages/picasso-code-browser/src/reactnative/index.ts
 */
import { Layer } from '../types';
import handleClassName from '../handleClassName';
import { picassoTrans } from '../../../picasso-trans/src';
import { WebScale, Unit, ColorFormat, CodeType } from '../../../sketch-dsl/src';
import { generateRNJSX } from './generateJSX';
import { generateRNStyle } from './generateStyle';

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
        
        export default class PicasoPage extends Component {
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
