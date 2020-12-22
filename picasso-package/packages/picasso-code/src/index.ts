import { picassoWebCode, picassoWebCodeFile } from './web';
import { picassoWeappCode, picassoWeappCodeFile } from './weapp';
import { picassoRNCode, picassoRNCodeFile } from './reactnative';
import { Layer, } from './types';
import { CodeType } from '../../sketch-dsl/src';
/**
 * 平台 web: web weapp: 小程序 rn: react-native
 */
type Platform = 'web'|'weapp'|'rn';

export const picassoCodeFile = (
    data: Layer[],
    outputPath: string,
    platform: CodeType = CodeType.WebPx,
) => {
    switch (platform) {
        case CodeType.WebPx:
            picassoWebCodeFile(data,outputPath);
            break;
        case CodeType.Weapp:
            picassoWeappCodeFile(data,outputPath);
            break;
        case CodeType.ReactNative:
            picassoRNCodeFile(data,outputPath);
            break;
        default:
            break;
    }
}

export const picassoCode = (
    data: Layer[],
    size: number, // 画板宽度 370px、750px 按照移动端处理
    platform: CodeType = CodeType.WebPx,
) => {
    switch (platform) {
        case CodeType.WebPx:
            return picassoWebCode(data,size);
        case CodeType.Weapp:
            return picassoWeappCode(data,size);
        case CodeType.ReactNative:
            return picassoRNCode(data,size);
        default:
            break;
    }
}

export * from './web';
export * from './weapp';
export * from './reactnative';
