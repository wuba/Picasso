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
| `bakeRestoreTree(node)` | CSS-ready 后处理（schema 1.x，`picassoArtboardRestoreParse` 内部已调用）：tint / text.fills 下发删除、gradient.css 预算、位图 rotation/flip 语义统一、stroke 细直线矩形化、slice 切图上提。幂等；单独导出供插件端在切图 URL 回填后**必须再调一次**（位图相关两项依赖 image.url 存在） |

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

## 配套资源：`schema/` 与 `tools/`

这两个目录围绕 **RestoreDSL**（结构保真中间表示）配套维护，与 `RESTORE_SCHEMA_VERSION` 同步更新。npm 发包时随 tarball 一起分发，服务端 / 渲染端 / 校验端可直接取用。

### `schema/` — RestoreDSL 格式与渲染语义规范

| 文件 | 作用 |
| --- | --- |
| [`schema/restore-dsl.schema.json`](schema/restore-dsl.schema.json) | RestoreDSL 输出格式的**规范真源**（JSON Schema draft-07）。字段是否必填、枚举取值、缺省省略约定等以此为准 |
| [`schema/restore-dsl-rendering-guide.md`](schema/restore-dsl-rendering-guide.md) | **消费端渲染语义规范**——拿到合法 DSL 后怎么渲染才对。适用于所有 RestoreDSL 消费方：服务端 LLM 还原提示词、确定性渲染器、diff 可视化等 |

两个文件解决的问题不同：schema 回答"什么样的 JSON 是合法的"，rendering-guide 回答"合法 JSON 该怎么落到像素"。改任一份都要同步另一份 + `RESTORE_SCHEMA_VERSION`。

**校验产物合法性**（任选其一）：

```sh
# Python（内置 jsonschema）
python3 -m jsonschema -i your_restore.json schema/restore-dsl.schema.json

# Node（ajv-cli）
npx ajv validate -s schema/restore-dsl.schema.json -d your_restore.json
```

服务端 LLM 提示词工程建议直接引用 `restore-dsl-rendering-guide.md` 全文作为素材源，避免二次转述引入偏差。

### `tools/` — 确定性 HTML 渲染基线

| 文件 | 说明 |
| --- | --- |
| [`tools/gen_restore_html.js`](tools/gen_restore_html.js) | Node.js 实现（Node ≥ 14，可选依赖 `pngjs`）——对比页外壳，渲染核心在 `gen_restore_fragment.js` |
| [`tools/gen_restore_fragment.js`](tools/gen_restore_fragment.js) | Node.js 渲染核心 + 「只要还原稿」独立产物 API（片段 / 纯净页 / fitWidth 等比缩放） |

**定位**：模拟 LLM 消费者的确定性渲染器，把 RestoreDSL 渲染成静态 HTML 还原稿。用途是区分「**数据不够还原**」（改 parse / 插件）与「**LLM 没用好数据**」（改提示词）。schema 变更后拿真实产物跑一遍即回归对照。

渲染语义的工具实现收敛在 Node.js 侧：`gen_restore_fragment.js` 是核心，`gen_restore_html.js` 只负责组装对比页外壳。改渲染语义须同步 `gen_restore_fragment.js`、`schema/restore-dsl-rendering-guide.md` 与 `RESTORE_SCHEMA_VERSION`；涉及对比页能力时再同步 `gen_restore_html.js`。

#### CLI 用法

```sh
node tools/gen_restore_html.js <restore.json> <output.html>
```

产物是自包含单文件 HTML，内置 mode 切换（还原稿 / 原设计图 / 叠加对比 overlay）与缩放选择，用浏览器直接打开即可。运行完成后会在 stdout 打印 `written: <path> (<bytes> bytes)`，并把过程中记录的 `[fix:xxx]` 修正项一并列出（供人工整理进文档）。

#### Node.js API 用法

入库 / 服务化场景可直接拿 HTML 字符串，无需落地文件：

```ts
const { generateRestoreHtml } = require('@wubafe/picasso-parse/tools/gen_restore_html');

const fixes = [];
const html = await generateRestoreHtml(dsl, {
  fontDir: '/path/a:/path/b',   // 可选，缺省读环境变量 PICASSO_FONT_DIR
  collectFixes: fixes,          // 可选，传数组收集 [tag, msg] 修正记录
});
// dsl 可以是 RestoreDSL 对象，也可以是 JSON 字符串
```

#### 只要还原稿（片段 / 纯净页，`gen_restore_fragment.js`）

`generateRestoreHtml` 的产物带工具栏与「原设计图 / 叠加对比」UI。若只需要还原稿本体（嵌入自己的页面、入库、或独立预览），用 `gen_restore_fragment.js`：

```ts
const {
  generateRestoreFragment,   // 片段：嵌入宿主页面 / 入库
  generateRestorePageHtml,   // 纯净页：无工具栏 / 对比 UI 的完整 HTML
} = require('@wubafe/picasso-parse/tools/gen_restore_fragment');

// 1) 片段
const frag = await generateRestoreFragment(dsl, { fontDir: '...', collectFixes: [] });
// frag = { html, css, fontFaces, width, height, title, fixes }
// html 是还原稿 artboard 节点本体；css（基础样式，全部锚在 .artboard 下不污染全局）
// 与 fontFaces（@font-face）需一并注入宿主页面

// 2) 纯净页
const page = await generateRestorePageHtml(dsl, { fitWidth: true });
```

对应 CLI（产出纯净页）：

```sh
node tools/gen_restore_fragment.js <restore.json> <output.html> [--fit-width]
```

**自适应说明**：还原稿本体是**定宽像素产物**（全部节点 `absolute` + px，基准为画板设计宽度），本身不自适应。`fitWidth: true` 时纯净页外层按视口宽度做 `transform: scale` 等比缩放（视觉自适应，不改变内部像素基线），默认关闭；片段始终定宽，宿主页面需要自适应时自行对片段外层做同样的等比缩放（`scale(容器宽 / frag.width)` + `transform-origin: 0 0`）。

#### 字体嵌入（`PICASSO_FONT_DIR`）

设计稿常用私有字体（如 58 数字字体 `don58`）浏览器无内置，回退 PingFang 后字宽会明显失真（实测数值会压住后续文本）。通过环境变量 `PICASSO_FONT_DIR` 指定字体来源，脚本会按 DSL 实际用到的 `fontFamily` 匹配、base64 内联为 `@font-face`；找不到时仅 log 提示不阻断。

条目支持两种形态（可混用）：

- **本地目录**：递归查找 `<family>*.woff2 / woff / ttf`
- **字体文件完整 URL**（`https?://.../don58-Medium_V1.4.woff2`）：HTTP 无法枚举远程目录，只支持点名到文件；按 URL 文件名做同样的 family/weight 匹配，命中后整文件下载内联，下载失败仅 log 不阻断

分隔规则：

- 字符串含 `://` → 用英文**逗号**分隔（URL 自身带冒号，无法再冒号分隔）
- 否则按老口径**冒号**分隔（与 `$PATH` 一致）
- Node.js API 的 `fontDir` 也可以直接传数组

```sh
# 纯本地目录
export PICASSO_FONT_DIR="/Users/me/fonts:/Users/me/private-fonts"

# 混用本地目录与远程 URL
export PICASSO_FONT_DIR="/Users/me/fonts,https://cdn.example.com/don58-Medium.woff2"

node tools/gen_restore_html.js restore.json out.html
```

以 `.` 开头的 PostScript 名（`.SFNS` 等）是 macOS 私有系统字体、无文件可嵌，脚本会自动跳过、走消费端兜底链。

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
