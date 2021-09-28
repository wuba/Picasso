// import * as path from 'path'
// import * as fs from 'fs'
import { picassoArtboardCodeParse, picassoArtboardLowcodeParse } from '../src'
const dsl = require('./code_dsl.json')

const data = picassoArtboardLowcodeParse(dsl);
