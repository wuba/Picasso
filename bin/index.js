#!/usr/bin/env node
const package = require('../package.json');
const program = require('commander');
const picasso = require('../src/index');

// 命令行参数
program
    .version(package.version, '-v, --version','picasso版本')
    .requiredOption('-s, --src [path]', 'sketch设计稿源文件路径')
    .option('-d, --dest [string]', '解析生成的代码存放路径')
    .option('-s, --imgScale [number]', '图片尺寸(1:1倍图 1.5:1.5倍图 2:2倍图 3:3倍图)', 1) // 图片尺寸(1 1.5 2 3)
    .option('-t, --pageType [number]', '解析类型: 1-普通版 2-运营版', 1) // 1 普通版 2 运营版
    .option('-p, --classPrefix [string]', '生成样式className前缀', '') //  默认''

// 命令行输出Examples
program.on('--help', function(){
    console.log(`
        Examples:
            $ picasso --src src/test.sketch --dest dest
            $ picasso -s src/test.sketch -d dest
    `)
});

program.parse(process.argv);

if (!program.src) {
    throw new Error('缺少参数 --src [path]')
}

if (!program.src || !program.src.length) {
    console.log(`error: required option '-s, --src [path]' not specified`);
    return;
}

// 检测文件名是否合法
const isSketchFile = /\.sketch$/.test(program.src);

if (!isSketchFile) {
    console.log('error: 文件格式错误，只能解析sketch文件(.sketch)');
    return;
}

(async () => {
    await picasso(program);
})()
