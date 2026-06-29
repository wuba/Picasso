# picasso-dsl

> Picasso 中间 DSL 的类型定义层 —— 描述 Sketch JSON 被解析成的「平台无关组件树」。

⚠️ 本包标记为 `"private": true`，不会单独发布到 npm。它的代码会在
[`@wubafe/picasso-parse`](../picasso-parse) 编译时通过相对路径一并打入 `dist/`，
对外只暴露一个 npm 包入口。

## 职责

定义 Picasso 解析流程中各阶段共用的核心类型：

- `Component` / `BaseComponent` —— DSL 节点（解析后的"组件"）
- `Structure` —— 节点层级关系（父子 / 兄弟 / 位置）
- `Style` / `LStyle` —— 解耦自 Sketch 的样式描述
- `DSL = Component[]` —— 一个画板对应的根节点数组
- `Layer` —— 在 BaseComponent 之上叠加运行时字段，供下游布局阶段使用
- `common` —— 跨子包共享的枚举与小工具类型

## 与 `sketch-dsl` 的区别（容易混淆）

仓库里有两个名字含 `dsl` 的包，**都在使用、不可合并**，它们处于数据流的不同位置：

```
.sketch ─导出─▶ Sketch 原始 JSON ─解析─▶ Picasso 中间 DSL ─布局/生成─▶ Web/小程序/RN 代码
                  ↑                          ↑
                  sketch-dsl 描述这一层      picasso-dsl 描述这一层（本包）
```

| 维度 | [`sketch-dsl`](../sketch-dsl) | `picasso-dsl`（本包） |
| --- | --- | --- |
| 描述对象 | Sketch 工具吐出的**原始数据**结构 | Picasso 解析后的**跨平台中间态** |
| 来源约束 | 受 Sketch 文件格式约束，不可自由改 | Picasso 自定义，可演进 |
| 数据流位置 | **输入侧**（最上游） | **中间态**（解析之后、布局之前） |
| 典型类型 | `SKLayer` / `SKColor` / `SKFrame` / `Panel` | `Component` / `Structure` / `Style` |

本包自身也会 `import { Panel } from '../sketch-dsl/src'`，可直接看出这是上下游依赖关系，而非新旧替代。

## 上下游

- **被谁用**：`picasso-parse`（`parseDSL` 阶段把 `SKLayer` 转成 `Component` 树）
- **依赖谁**：在类型层面引用 `sketch-dsl` 的 SK* 系列；无运行时依赖

## 本地开发

```sh
cd packages/picasso-dsl
npm install
npm run build   # tsc → dist/
```

详见 [Picasso 主仓库 README](../../README.md) 与 [@wubafe/picasso-parse](../picasso-parse)。
