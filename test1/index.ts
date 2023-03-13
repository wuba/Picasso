// import * as fs from 'fs'
// const pagesJson = require('./pages/78626ADA-1A66-4E6E-A0AE-566E1256DA3E.json')
// const documentJson = require('./document.json')
// const foreignSymbols = documentJson.foreignSymbols
// const artboard: any = pagesJson.layers[0]

// function getSymbolLayersByDoc(symbolID: string) {
//     const findSymbol = foreignSymbols.find(
//         (doc: any) => doc.symbolMaster.symbolID === symbolID
//     )

//     if (!findSymbol) {
//         return []
//     }

//     return findSymbol.symbolMaster.layers || []
// }

// const artboardLayer = artboard.layers

// function matchArtboardLayer(aLayer: any[]) {
//     aLayer.forEach((doc: any) => {
//         if (doc._class !== 'symbolInstance' && doc.layers) {
//             matchArtboardLayer(doc.layers)
//             return
//         }

//         if (!doc.layers){
//             doc.layers = []
//         }

//         doc.layers = getSymbolLayersByDoc(doc.symbolID)
//     })
// }

// matchArtboardLayer(artboardLayer)


// // fs.writeFileSync('./artboardLayer.json', JSON.stringify(artboard, null, 2))

// import { picassoArtboardCodeParse } from '../picasso-package/packages/picasso-parse/src/index'


// const data = picassoArtboardCodeParse(JSON.parse(JSON.stringify(artboard)))

// // fs.writeFileSync(
// //     './test_picassoArtboardCodeParse_dsl.json',
// //     JSON.stringify(data, null, 2)
// // )
import { fromFile } from '@sketch-hq/sketch-file'
import { resolve } from 'path'
import * as fs from 'fs'

const sketchDocumentPath = './picasso.sketch'

fromFile(resolve(__dirname, sketchDocumentPath)).then((parsedFile) =>
    {
        fs.writeFileSync(
            './parsedFile.json',
            JSON.stringify(parsedFile, null, 2)
        )
    }
)
