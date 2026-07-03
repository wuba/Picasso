# picasso-trans

> Picasso 的转换工具集 —— 颜色 / 单位 / CSS 顺序 / 跨端样式 / 各平台代码片段的格式化转换。

⚠️ 本包标记为 `"private": true`，不会单独发布到 npm。它的代码会在
[`@wubafe/picasso-parse`](../picasso-parse) 编译时通过相对路径一并打入 `dist/`，
对外只暴露一个 npm 包入口。

## 职责

聚合 Picasso 链路中所有"格式与单位级"的转换原语：

- `colorTrans` —— Sketch RGBA → CSS / RN / 十六进制等
- `formateDslStyle` / `formateDslRemStyle` / `formatDslRpxStyle` —— 把 DSL Style 标准化为 px / rem / rpx
- `dslPxtoRem` / `dslPxtoRpx` / `transScale` —— 跨端尺寸换算
- `cssOrder` —— 输出稳定的 CSS 属性顺序，避免 diff 噪声
- `transWebCode` / `transRNStyle` / `transAndroidCode` / `transIOSCode` —— 各平台代码片段转换器
- `transPanel` —— 画板级别的输出整形
- `picassoTrans(data, options)` —— 顶层聚合入口

## 上下游

- **被谁用**：`picasso-code-browser`（在生成各平台代码时调用），以及 `picasso-parse`（按 `tsconfig.include` 直接编进 `dist/`）
- **依赖谁**：无

## 本地开发

```sh
cd packages/picasso-trans
npm install
npm run build   # tsc → dist/
```

详见 [Picasso 主仓库 README](../../README.md) 与 [@wubafe/picasso-parse](../picasso-parse)。
