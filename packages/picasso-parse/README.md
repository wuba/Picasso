# @wubafe/picasso-parse

> [Picasso](https://github.com/wuba/Picasso) 的核心解析引擎：把 Sketch 画板的 JSON 描述解析成跨平台 DSL，并按目标平台输出 Web / 微信小程序 / ReactNative 代码。

[![npm version](https://img.shields.io/npm/v/@wubafe/picasso-parse.svg)](https://www.npmjs.com/package/@wubafe/picasso-parse)

## 简介

`@wubafe/picasso-parse` 是 [Picasso Sketch 插件](https://github.com/wuba/Picasso) 抽离出来的纯逻辑层，**不依赖 Sketch 运行时**。只要你能提供一份符合 Sketch 导出格式的画板 JSON（`sketch.export(artboard, { formats: 'json' })` 的产物），就可以独立调用本包完成：

- 画板预处理（图层裁剪、Symbol 展开、字体修正等）
- 中间 DSL 生成（`Component` 树）
- 特征分组与自动布局
- 跨平台代码生成（Web 普通版 / Web 运营版 / 微信小程序 / ReactNative）

适用于：

- 自建设计稿转代码服务
- 在 CI / 后端流程里把 `.sketch` 产物转成可用代码
- 与 Picasso 插件以外的设计工具集成

## 安装

```sh
npm install @wubafe/picasso-parse
# 或
yarn add @wubafe/picasso-parse
```

> 要求 Node.js ≥ 10。本包目标产物为 `es6` + `commonjs`（见 `tsconfig.json`），开箱即用，可在 Node 与现代浏览器环境运行。

## 快速上手

```ts
import {
  picassoArtboardCodeParse,        // 解析为 DSL（普通 Web / 移动端）
  picassoArtboardOperationCodeParse,// 解析为 DSL（运营版，绝对定位）
  picassoArtboardLowcodeParse,     // 解析为 DSL（低代码 / 海葵组件）
  picassoArtboardMeatureParse,     // 解析为标注 DSL
  picassoCode,                     // 由 DSL 生成跨平台代码
  CodeType,                        // 平台枚举
} from '@wubafe/picasso-parse';

// 1. 拿到画板 JSON（任意 Sketch 解析途径，能产出与 sketch.export 等价的 JSON 即可）
const artboardJSON = require('./artboard.json');

// 2. JSON → 中间 DSL
const dsl = picassoArtboardCodeParse(artboardJSON);

// 3. DSL → 具体平台代码
const webCode = picassoCode([dsl], artboardJSON.frame.width, CodeType.WebPx);
const weappCode = picassoCode([dsl], artboardJSON.frame.width, CodeType.Weapp);
const rnCode = picassoCode([dsl], artboardJSON.frame.width, CodeType.ReactNative);
```

## 暴露的 API

### 画板解析（JSON → DSL）

| 函数 | 用途 |
| --- | --- |
| `picassoArtboardCodeParse(layer)` | 普通 Web / 移动端：DSL → 特征分组 → 自动布局 → className |
| `picassoArtboardOperationCodeParse(layer)` | 运营版：DSL → 绝对定位布局 → className |
| `picassoArtboardLowcodeParse(layer)` | Lowcode / 海葵组件场景，DSL → 特征分组 → 布局 |
| `picassoArtboardMeatureParse(layer)` | 用于设计标注，仅产出 DSL，不做布局 |

所有函数签名一致：`(layer: SKLayer) => Component`，返回 Picasso 中间 DSL 的根节点。

### RestoreDSL（结构保真中间表示，0.0.45 新增）

与上述四个函数不同，RestoreDSL 相关 API 是**多输入签名**（三导出管线）：

| 函数 | 用途 |
| --- | --- |
| `annotateStableIds(exportB, exportA?, mastersC?)` | 把 `stableId` / `contentHash` / `styleHash` / `subtreeHash` 原地注入解绑副本树（导出 B），解绑点上再加 `restoreComponentKey` / `restoreOverrides`。注入后再喂给四种存量 DSL 解析方法，产物即携带同一批稳定 ID + 内容指纹 + 样式指纹（条件透传，未注入的老输入产出逐字节不变） |
| `picassoArtboardRestoreParse(exportA, exportB, mastersC?, options?)` | 三份输入合并（ID 回填 + components 组装 + overrides 解析），产出 RestoreDSL：结构保真（1:1 镜像图层树）、值归一化、无布局推断 |
| `assessRestoreDiffability(prev, next)` | 跨版本 diff 前置判定：给两版 RestoreDSL 打 `same-artboard` / `duplicated-artboard` / `unrelated` 三档标签，服务端 diff 第一步用它选择配对策略 |
| `toRenderProfile(restore)` | LLM 还原用的精简视图：剥离 hash / components 字典 / 透明占位，可节省 31~44% 体积。全量产物照常落库，此函数只影响 LLM 提示词素材 |

- `exportA`：原始画板 JSON（`sketch.export` 直接导出，do_objectID 持久稳定）
- `exportB`：解绑 Symbol 后的副本画板 JSON（几何精确的展开树）
- `mastersC`：画板引用到的 symbolMaster JSON 列表（可缺省，components 字典降级）
- `options`：`{ sketchVersion, pluginVersion, documentId, generatedAt, componentsOmitted, assetsBaseUrl, assetsScale, componentSources }`

推荐调用顺序：三导出 → `annotateStableIds` → 四种存量 DSL 与 `picassoArtboardRestoreParse` 消费同一棵注入后的树。

四种存量 DSL 透传的注入字段：`stableId` / `contentHash` / `subtreeHash` / `styleHash`（`restoreComponentKey` / `restoreOverrides` 只落 RestoreDSL，不透传）。

### 代码生成（DSL → 文本）

| 函数 | 输出 |
| --- | --- |
| `picassoCode(layers, size, platform)` | 按 `CodeType` 分发到下方三个生成器 |
| `picassoWebCode(layers, size)` | Web 端 HTML + SCSS |
| `picassoWeappCode(layers, size)` | 微信小程序 WXML + WXSS |
| `picassoRNCode(layers, size)` | ReactNative JSX + StyleSheet |

`size` 为画板宽度（建议 `375` / `750`，影响是否注入 rem 适配方案）。

### 类型

- `SKLayer`、`SKColor` 等 Sketch 原始结构 —— 透传自 `sketch-dsl`
- `Component`、`Structure`、`Style` 等中间 DSL —— 来自 `picasso-dsl`
- `CodeType` 平台枚举（`WebPx` / `Weapp` / `ReactNative`）

完整的类型定义会随 npm tarball 一起发布到 `dist/**/*.d.ts`，可直接在 TypeScript 项目中享受智能提示。

## 与 Picasso Sketch 插件的关系

本包是 [Picasso 仓库](https://github.com/wuba/Picasso) 中 `packages/` 下的入口包，**也是该仓库唯一对外发布的 npm 包**。仓库内 `picasso-dsl` / `picasso-group` / `picasso-layout` / `picasso-trans` / `picasso-code-browser` / `sketch-dsl` 六个 sibling 包都标记了 `"private": true`，由本包在 `tsc` 编译时通过相对路径一并编进 `dist/`，对外只暴露 `@wubafe/picasso-parse` 一个入口。

→ 如果你要使用的是 Sketch 插件本体而非解析库，请回到 [Picasso 主仓库 README](https://github.com/wuba/Picasso/blob/master/README.md)。

## 本地开发

```sh
git clone https://github.com/wuba/Picasso.git
cd Picasso/packages/picasso-parse

npm install
npm run build        # tsc → dist/，会一并编译 sibling 包源码

npm run test         # ts-node-dev 监听 test/index.ts
```

发布：

```sh
# 在 packages/picasso-parse 目录下
npm version <patch|minor|major>
npm publish --access public
```

## 贡献

欢迎在 [Picasso 主仓库](https://github.com/wuba/Picasso) 提 Issue / PR。涉及解析逻辑、DSL 类型、跨平台代码生成的变更通常都落在 `packages/` 下。

## License

[MIT](https://github.com/wuba/Picasso/blob/master/LICENSE)
