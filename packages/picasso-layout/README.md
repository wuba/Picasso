# picasso-layout

> Picasso 的自动布局阶段 —— 在 [`picasso-group`](../picasso-group) 分组结果之上推算 flex / 块级 / 行内布局与对齐方式。

⚠️ 本包标记为 `"private": true`，不会单独发布到 npm。它的代码会在
[`@wubafe/picasso-parse`](../picasso-parse) 编译时通过相对路径一并打入 `dist/`，
对外只暴露一个 npm 包入口。

## 职责

把分组后的 DSL 转成可直接渲染的布局描述：

- `handleOverlap` —— 重叠图层处理（决定 absolute / relative）
- `calculateRow` / `row` —— 行布局推断（水平排列、间距、对齐）
- `isBlock` / `calculateBlock` —— 块级元素识别与尺寸推算
- `handleParentIsText` —— 父节点为文本时的特殊处理
- `markIsOnlyText` —— 纯文本节点标记，避免被包装成额外容器
- `getBorderWidth` —— 边框宽度修正
- `calculateClassName` —— 布局相关的 className 派生
- `handleTypeLayout/` —— 不同节点类型的布局分发

默认导出 `handleLayout(layers: Layer[]): Layer[]`，串联以上步骤。

## 上下游

- **被谁用**：`picasso-parse`（`picassoArtboardCodeParse` / `picassoArtboardLowcodeParse` 中的"布局处理"环节）
- **依赖谁**：通过相对路径引用 `picasso-dsl` 的类型；无运行时依赖

## 本地开发

```sh
cd packages/picasso-layout
npm install
npm run build   # tsc → dist/
```

详见 [Picasso 主仓库 README](../../README.md) 与 [@wubafe/picasso-parse](../picasso-parse)。
