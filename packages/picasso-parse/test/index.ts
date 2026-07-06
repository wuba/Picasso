import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { picassoArtboardMeatureParse } from '../src'
// const dsl = require('./code_dsl.json')
const dsl = require('./test_dsl.json')

const data = picassoArtboardMeatureParse(dsl);
// 将调试产物写到系统临时目录，避免发版前跑测试时把生成 JSON 混进 npm 包。
const outputPath = path.join(os.tmpdir(), 'picassoArtboardCodeParse_dsl.json')
fs.writeFileSync(outputPath, JSON.stringify(data ,null,2));

