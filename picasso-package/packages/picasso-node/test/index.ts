import * as path from 'path'
import * as fs from 'fs'
import { sketchToJson, picassoArtboardFileCreate, detachSymbolInstance } from '../src'

const basePath = path.join(__dirname);
if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath);
}

// const data = picassoArtboardFileCreate(`${basePath}/picassoSymbol.sketch`);

let filedir = path.join(basePath, '../sketch/document/0D79978D-044D-4240-8DFE-8AF7DF313626.json');

let symbolStr = fs.readFileSync(filedir, 'utf-8');
const symbolContent = JSON.parse(symbolStr);
const data = detachSymbolInstance(symbolContent)
