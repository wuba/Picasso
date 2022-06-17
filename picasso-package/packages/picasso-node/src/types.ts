
import { SKLayer,SKFrame } from '../../sketch-dsl/src';

export * from '../../picasso-dsl/src';
export * from '../../sketch-dsl/src';
interface Frame extends SKFrame {
    imgWidth?: number
    imgHeight?: number
    sizeX?:number
    sizeY?:number
}

export interface Layer extends SKLayer {
    isDelete?: boolean
    parentList?:any
    frame: Frame
    isRegular?: boolean
    realFrame?:any
    layers?: Layer[]
    md5?: string
}

/**
 * sketch 相关路径
 */
export type SKPathMap = {
    sketchFilePath: string  // sketch源文件路径
    sketchResultPath: string  // sketch生成结果存储路径
    shapePath: string  // shape导出图片存储路径
    sketchPath: string  // sketch备份文件路径
    imagePath: string  // 生成图片存储路径
}

/**
 * 导出切片格式
 */
export type ExportImageParams = {
    formats: string // eg: "jpg,png,svg,pdf" "png"
    scales: string // eg: "1,2,3" "1"
}

export { Layer as DLaysr } from '../../picasso-dsl/src';
