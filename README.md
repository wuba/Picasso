
# Picasso

> 一款sketch插件，可将sketch设计稿页面自动解析成前端代码。
## 简介

[Picasso](https://github.com/wuba/Picasso/releases/download/v2.2.3/picasso.sketchplugin.zip)是58同城推出的一款sketch设计稿解析插件，可将sketch设计稿自动解析成还原精准，可用度高的前端代码。

## 前提
- Sketch >= 60 [下载Sketch](https://www.sketch.com/)
## 使用
注：安装picasso插件之前，请先安装[sketch](https://www.sketch.com/)

[下载picasso插件](https://github.com/wuba/Picasso/releases/download/v2.2.3/picasso.sketchplugin.zip) => picasso.sketchplugin.zip 解压压缩包，双击安装即可，如下：

![1.jpg](https://wos.58cdn.com.cn/IjGfEdCbIlr/ishare/f3c38c05-9051-4b87-b5ad-32439b0dfed71.jpg)

安装完成后在sketch软件中使用插件，如下图所示：

![two.gif](https://wos.58cdn.com.cn/IjGfEdCbIlr/ishare/43582d7b-0d66-4cc1-b240-7ba55aaa4acctwo.gif)

### 功能介绍
#### 选择画板
- 选中画板：对当前选中的画板进行代码生成。
- 全部画板：对所有画板进行代码生成。
#### 生成代码
- web代码：普通web代码，结构布局合理、代码可用度高；适用于移动端列表、详情等页面。
- web运营版：采用绝对定位布局、代码还原度高；适用于运营活动页、静态页。
- 微信小程序：生成微信小程序代码。
- ReactNative：生成ReactNative代码。

## 开发说明

``` sh
  # 插件目录
  cd picasso
  # 安装依赖
  npm install
  # 启动
  npm start
  # 打包
  npm run build
```
## 贡献

阅读我们的[贡献指南](https://github.com/wuba/Picasso/wiki/%E8%B4%A1%E7%8C%AE%E6%8C%87%E5%8D%97)，让我们一起构建一个更好的 Picasso。

您可以将任何想法作为[拉取请求](https://github.com/wuba/Picasso/pulls)或[GitHub 问题](https://github.com/wuba/Picasso/issues)提交。

如果您想改进代码，请参考上述 [开发说明](#开发说明) 。

如果您是协作者，请按照我们的[Pull Request 原则使用](https://github.com/wuba/Picasso/wiki/PR-%E8%A7%84%E8%8C%83)[协作者模板](https://github.com/wuba/Picasso/compare)创建 Pull Request 。

## 技术讨论

欢迎参与Picasso项目的开发建设和讨论，[点击这里](https://github.com/wuba/Picasso/issues/26)进群讨论。
