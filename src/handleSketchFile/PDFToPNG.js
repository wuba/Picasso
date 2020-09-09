const Canvas = require('canvas');
const fs = require('fs');
const pdfjsLib = require('pdfjs-dist');
class NodeCanvasFactory {
    create(width, height) {
        const canvas = Canvas.createCanvas(width, height);
        const context = canvas.getContext('2d');
        return {
            canvas: canvas,
            context: context,
        };
    }
    reset(canvasAndContext, width, height) {
        canvasAndContext.canvas.width = width;
        canvasAndContext.canvas.height = height;
    }
    destroy(canvasAndContext) {
        canvasAndContext.canvas.width = 0;
        canvasAndContext.canvas.height = 0;
        canvasAndContext.canvas = null;
        canvasAndContext.context = null;
    }
}
/**
 * 将PDF格式图片转换为PNG格式图片
 *
 * @param {string} [filePath='./image_9700_19_1.pdf']
 */
module.exports =async (filePath='./image_9700_19_1.pdf') => {
    // Relative path of the PDF file.
    const pdfURL = filePath;
    // Read the PDF file into a typed array so PDF.js can load it.
    const rawData = new Uint8Array(fs.readFileSync(pdfURL));
    // Load the PDF file.
    const loadingTask = pdfjsLib.getDocument(rawData);
    const pdfDocument = await loadingTask.promise;
    const page = await pdfDocument.getPage(1);
    const viewport = page.getViewport(1.0);
    const canvasFactory = new NodeCanvasFactory();
    const canvasAndContext =canvasFactory.create(viewport.width, viewport.height);
    const renderContext = {
        canvasContext: canvasAndContext.context,
        viewport: viewport,
        canvasFactory: canvasFactory,
    };
    const renderTask = page.render(renderContext);
    await renderTask.promise;
    const image = canvasAndContext.canvas.toBuffer();
    fs.writeFileSync(`${filePath.slice(0,-4)}.png`, image);
}

