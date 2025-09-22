// import * as path from 'path'
import * as fs from 'fs'
import { picassoArtboardMeatureParse } from '../src'
// const dsl = require('./code_dsl.json')
const dsl = require('./test_dsl.json')

const data = picassoArtboardMeatureParse(dsl);
fs.writeFileSync('./picassoArtboardCodeParse_dsl.json',JSON.stringify(data ,null,2));


