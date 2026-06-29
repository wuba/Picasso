# sketch-dsl

> Sketch 原始 JSON 的 TypeScript 类型层 —— 把 `sketch.export(artboard, { formats: 'json' })` 产物的结构形式化。

⚠️ 本包标记为 `"private": true`，不会单独发布到 npm。它的代码会在
[`@wubafe/picasso-parse`](../picasso-parse) 编译时通过相对路径一并打入 `dist/`，
对外只暴露一个 npm 包入口。

## 职责

为 Sketch 画板 JSON 提供类型骨架，作为 Picasso 解析流程的输入定义：

- `SKLayer` —— 通用图层类型（递归 `layers` 子节点）
- `SKColor` / `SKFrame` / `SKStyle` / `SKImage` / `SKAttributedString` —— Sketch 原始结构
- `Panel` / `PanelOptions` —— 画板与解析选项
- `common` —— 跨子包共享的枚举（如 `CodeType`：`WebPx` / `Weapp` / `ReactNative`）

整个包以**类型**为主，几乎没有运行时代码。

## 与 `picasso-dsl` 的区别（容易混淆）

仓库里有两个名字含 `dsl` 的包，**都在使用、不可合并**，它们处于数据流的不同位置：

```
.sketch ─导出─▶ Sketch 原始 JSON ─解析─▶ Picasso 中间 DSL ─布局/生成─▶ Web/小程序/RN 代码
                  ↑                          ↑
                  sketch-dsl 描述这一层      picasso-dsl 描述这一层
```

| 维度 | `sketch-dsl`（本包） | [`picasso-dsl`](../picasso-dsl) |
| --- | --- | --- |
| 描述对象 | Sketch 工具吐出的**原始数据**结构 | Picasso 解析后的**跨平台中间态** |
| 来源约束 | 受 Sketch 文件格式约束，不可自由改 | Picasso 自定义，可演进 |
| 数据流位置 | **输入侧**（最上游） | **中间态**（解析之后、布局之前） |
| 典型类型 | `SKLayer` / `SKColor` / `SKFrame` / `Panel` | `Component` / `Structure` / `Style` |

`picasso-dsl` 自身也会 `import { Panel } from '../sketch-dsl/src'`，可直接看出这是上下游依赖关系。

## 上下游

- **被谁用**：`picasso-dsl`、`picasso-parse`、`picasso-code-browser` 三方都依赖
- **依赖谁**：无

## 本地开发

```sh
cd packages/sketch-dsl
npm install
npm run build   # tsc → dist/
```

详见 [Picasso 主仓库 README](../../README.md) 与 [@wubafe/picasso-parse](../picasso-parse)。
