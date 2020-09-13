const picasso = require('../src/index');

(async () => {
    await picasso({
        src: 'test/标签20200521sketch_副本.sketch', // sketch源文件路径
        dest: 'test', // 生成代码存放路径
        imgScale: 1, // 导出图片尺寸(1 1.5 2 3) 默认 1
        pageType: 1, // 1 普通版(布局合理，可用度高) 2 运营版(还原精准，定位布局) 默认 1
        classPrefix: '', // 生成样式className前缀 默认 '' });
    })
})()
