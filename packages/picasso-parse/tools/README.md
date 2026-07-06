# RestoreDSL 确定性 HTML 渲染器

把 RestoreDSL（`schemaVersion 1.0`）渲染成静态 HTML 还原稿。**模拟 LLM 消费者的确定性渲染基线**，用于区分：

- **「数据不够还原」** → 改 `packages/picasso-parse/src/parseRestoreDSL/` 或插件端切图/字体采集
- **「LLM 没用好数据」** → 改服务端提示词

schema 变更后拿真实产物跑一遍即回归对照。渲染语义规范见 [`../schema/restore-dsl-rendering-guide.md`](../schema/restore-dsl-rendering-guide.md)。

## 文件

| 文件 | 运行时 | 可选依赖 |
| --- | --- | --- |
| [`gen_restore_html.js`](gen_restore_html.js) | Node.js ≥ 14 | `pngjs`（老素材无 `image.frame` 时的像素校准回退）——对比页外壳，渲染核心在 `gen_restore_fragment.js` |
| [`gen_restore_fragment.js`](gen_restore_fragment.js) | Node.js ≥ 14 | `pngjs`（同上）——渲染核心 + 「只要还原稿」独立产物 API |

渲染语义的工具实现收敛在 Node.js 侧：`gen_restore_fragment.js` 是核心，`gen_restore_html.js` 只负责组装对比页外壳。渲染语义变更必须同步 `gen_restore_fragment.js`、`../schema/restore-dsl-rendering-guide.md` 与 `RESTORE_SCHEMA_VERSION`，否则会破坏对照价值；涉及对比页能力时再同步 `gen_restore_html.js`。

## CLI 用法

```sh
node gen_restore_html.js <restore.json> <output.html>
```

产物是自包含单文件 HTML，内置 mode 切换（还原稿 / 原设计图 / 叠加对比 overlay）与缩放选择，浏览器直接打开即可。stdout 会输出 `written: <path> (<bytes> bytes)`，并列出过程中记录的 `[fix:xxx]` 修正项（供人工整理进文档）。

## Node.js API 用法

入库 / 服务化场景可直接拿 HTML 字符串，无需落地文件：

```js
const { generateRestoreHtml } = require('./gen_restore_html');

const fixes = [];
const html = await generateRestoreHtml(dsl, {
  fontDir: '/path/a:/path/b',   // 可选，缺省读环境变量 PICASSO_FONT_DIR
  collectFixes: fixes,          // 可选，传数组收集 [tag, msg] 修正记录
});
// dsl 可以是 RestoreDSL 对象，也可以是 JSON 字符串
```

## 只要还原稿：`gen_restore_fragment.js`

`generateRestoreHtml` 的产物带工具栏与对比 UI。只需要还原稿本体时：

```js
const {
  generateRestoreFragment,   // 片段：嵌入宿主页面 / 入库
  generateRestorePageHtml,   // 纯净页：无工具栏 / 对比 UI 的完整 HTML
} = require('./gen_restore_fragment');

const frag = await generateRestoreFragment(dsl, { fontDir, collectFixes });
// frag = { html, css, fontFaces, width, height, title, fixes }
// html 是还原稿 artboard 节点本体；css 与 fontFaces 需一并注入宿主页面

const page = await generateRestorePageHtml(dsl, { fitWidth: true });
```

对应 CLI（产出纯净页）：

```sh
node gen_restore_fragment.js <restore.json> <output.html> [--fit-width]
```

**自适应说明**：还原稿本体是**定宽像素产物**（全部节点 `absolute` + px），本身不自适应。`fitWidth: true` 时纯净页外层按视口宽度做 `transform: scale` 等比缩放（视觉自适应，不改变内部像素基线），默认关闭；片段始终定宽，宿主自适应时对片段外层做 `scale(容器宽 / frag.width)` + `transform-origin: 0 0`。

## 字体嵌入：`PICASSO_FONT_DIR`

设计稿常用私有字体（如 58 数字字体 `don58`）浏览器无内置，回退 PingFang 后字宽会明显失真（实测数值会压住后续文本）。通过环境变量指定字体来源，脚本按 DSL 实际用到的 `fontFamily` 匹配、base64 内联为 `@font-face`；找不到时仅 log 不阻断。

**条目形态**（可混用）：

- **本地目录** — 递归查找 `<family>*.woff2 / woff / ttf`
- **字体文件完整 URL**（`https?://.../don58-Medium_V1.4.woff2`）— HTTP 无法枚举远程目录，只支持点名到文件；按 URL 文件名做同样的 family/weight 匹配，命中后整文件下载内联，下载失败仅 log 不阻断

**分隔规则**：

- 字符串含 `://` → 用英文**逗号**分隔（URL 自身带冒号，不能再冒号分隔）
- 否则按老口径**冒号**分隔（与 `$PATH` 一致）
- Node API 的 `fontDir` 也可以直接传数组

```sh
# 纯本地目录
export PICASSO_FONT_DIR="/Users/me/fonts:/Users/me/private-fonts"

# 混用本地目录与远程 URL
export PICASSO_FONT_DIR="/Users/me/fonts,https://cdn.example.com/don58-Medium.woff2"

node gen_restore_html.js restore.json out.html
```

以 `.` 开头的 PostScript 名（`.SFNS` 等）是 macOS 私有系统字体，无文件可嵌，脚本会自动跳过、走消费端兜底链。

## 与 schema 的同步

本目录 Node.js 渲染工具、`../schema/restore-dsl.schema.json`、`../schema/restore-dsl-rendering-guide.md`、`../src/parseRestoreDSL/restoreTypes.ts` 的 `RESTORE_SCHEMA_VERSION` 必须同步维护——改任一处都要检查其余几处，否则渲染器会与产物脱节，失去对照价值。
