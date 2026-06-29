
# Picasso

> 一款 Sketch 插件，可将 Sketch 设计稿页面自动解析成前端代码。

## 简介

[Picasso](https://github.com/wuba/Picasso/releases/download/v2.2.3/picasso.sketchplugin.zip) 是 58 同城推出的一款 Sketch 设计稿解析插件，可将 Sketch 设计稿自动解析成还原精准、可用度高的前端代码，支持 **Web（普通版 / 运营版）**、**微信小程序**、**ReactNative** 四种产物。

## 前提

- Sketch >= 60 [下载 Sketch](https://www.sketch.com/)

## 使用

注：安装 Picasso 插件之前，请先安装 [Sketch](https://www.sketch.com/)。

[下载 picasso 插件](https://github.com/wuba/Picasso/releases/download/v2.2.3/picasso.sketchplugin.zip) ⇒ `picasso.sketchplugin.zip` 解压压缩包，双击安装即可，如下：

![1.jpg](https://wos.58cdn.com.cn/IjGfEdCbIlr/ishare/f3c38c05-9051-4b87-b5ad-32439b0dfed71.jpg)

安装完成后在 Sketch 软件中使用插件，如下图所示：

![two.gif](https://wos.58cdn.com.cn/IjGfEdCbIlr/ishare/43582d7b-0d66-4cc1-b240-7ba55aaa4acctwo.gif)

### 功能介绍

#### 选择画板
- **选中画板**：对当前选中的画板进行代码生成。
- **全部画板**：对所有画板进行代码生成。

#### 生成代码
- **Web 代码**：普通 Web 代码，结构布局合理、代码可用度高；适用于移动端列表、详情等页面。
- **Web 运营版**：采用绝对定位布局、代码还原度高；适用于运营活动页、静态页。
- **微信小程序**：生成微信小程序代码。
- **ReactNative**：生成 ReactNative 代码。

## 项目结构

仓库由两层组成——**插件本体**和**解析引擎 monorepo**：

```
Picasso/
├── src/              Sketch 插件本体（CocoaScript / JS），负责图层抽取、
│                     图片 / 字体 / Symbol 预处理与产物落盘
├── resources/        WebView UI（设计规范、帮助中心等界面）
├── assets/           插件图标等静态资源
├── packages/         解析引擎 monorepo（TypeScript 源码）
│   ├── picasso-parse/         唯一对外发布的入口包（@wubafe/picasso-parse）
│   ├── picasso-code-browser/  跨平台代码生成器（private）
│   ├── picasso-dsl/           Picasso 中间 DSL 类型（private）
│   ├── picasso-group/         特征分组（private）
│   ├── picasso-layout/        布局计算（private）
│   ├── picasso-trans/         颜色 / 单位 / CSS 顺序等转换（private）
│   └── sketch-dsl/            Sketch 原始 JSON 类型层（private）
└── webpack.skpm.config.js
```

> `packages/` 下除 `picasso-parse` 外都是 `"private": true`，由 `picasso-parse` 在编译时一起打进 tarball，对外只发布一个 npm 包：[`@wubafe/picasso-parse`](https://www.npmjs.com/package/@wubafe/picasso-parse)。

## 开发说明

### 插件本体

```sh
# 安装依赖
npm install

# 启动开发监听
npm start

# 一次性打包到 picasso.sketchplugin/
npm run build

# 清掉已安装版本并重新装入本地 Sketch
npm run reload
```

### 解析引擎（packages/）

```sh
cd packages/picasso-parse
npm install
npm run build       # tsc → dist/，会同时把 sibling 包的源码编进 dist/
npm publish         # 发布 @wubafe/picasso-parse
```

修改 `packages/` 下的解析逻辑后，需要重新构建 `picasso-parse` 并升级根目录的 `@wubafe/picasso-parse` 版本号，插件端才会看到改动。

## 贡献

阅读我们的[贡献指南](https://github.com/wuba/Picasso/wiki/%E8%B4%A1%E7%8C%AE%E6%8C%87%E5%8D%97)，让我们一起构建一个更好的 Picasso。

您可以将任何想法作为[拉取请求](https://github.com/wuba/Picasso/pulls)或 [GitHub Issue](https://github.com/wuba/Picasso/issues) 提交。

如果您想改进代码，请参考上述 [开发说明](#开发说明)。

如果您是协作者，请按照我们的 [Pull Request 规范](https://github.com/wuba/Picasso/wiki/PR-%E8%A7%84%E8%8C%83) 使用[协作者模板](https://github.com/wuba/Picasso/compare)创建 Pull Request。

## 技术讨论

欢迎参与 Picasso 项目的开发建设和讨论，[点击这里](https://github.com/wuba/Picasso/issues/26)进群讨论。
