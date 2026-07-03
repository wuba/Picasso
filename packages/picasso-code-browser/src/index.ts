import { picassoWebCode } from './web';
import { picassoWeappCode } from './weapp';
import { picassoRNCode } from './reactnative';
import { Layer, } from './types';
import { CodeType } from '../../sketch-dsl/src';



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
            return picassoRNCode(data, size);
        default:
            break;
    }
}

export * from './web';
export * from './weapp';
export * from './reactnative';
