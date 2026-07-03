# picasso-group

> Picasso 的特征分组阶段 —— 识别 DSL 节点的视觉特征，把零散图层重新聚合成"行 / 块 / 容器"等可布局的组。

⚠️ 本包标记为 `"private": true`，不会单独发布到 npm。它的代码会在
[`@wubafe/picasso-parse`](../picasso-parse) 编译时通过相对路径一并打入 `dist/`，
对外只暴露一个 npm 包入口。

## 职责

把扁平的 DSL 树重新组织成更接近"代码语义"的结构，为后续 [`picasso-layout`](../picasso-layout) 提供素材：

- `handleLayer` —— 图层级别的预处理（清洗 / 标记）
- `handleCascading` —— 处理层级叠加（同层覆盖、子父关系修正）
- `handleRow` —— 同行特征识别与归并
- `recombine/` —— 节点重组（把视觉上属于同一组件的图层包到一个容器）
- `formatData` —— 输出前的字段整形
- `domFormat` —— 类 DOM 结构化输出
- `styleFix` —— 分组过程中产生的样式修正
- `IdentifyLayout/` —— 布局特征识别（行 / 列 / 网格 / 重叠 …）

默认导出一个 `(dsl: DSL) => DSL` 函数，串联以上步骤。

## 上下游

- **被谁用**：`picasso-parse`（`picassoArtboardCodeParse` / `picassoArtboardLowcodeParse` 中的"特征分组"环节）
- **依赖谁**：通过相对路径引用 `picasso-dsl` 的类型；无运行时依赖

## 本地开发

```sh
cd packages/picasso-group
npm install
npm run build   # tsc → dist/
```

详见 [Picasso 主仓库 README](../../README.md) 与 [@wubafe/picasso-parse](../picasso-parse)。
