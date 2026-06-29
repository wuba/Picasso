# picasso-code-browser

> Picasso 的跨平台代码生成器 —— 把布局完成的 DSL 输出为 Web / 微信小程序 / ReactNative 代码。

⚠️ 本包标记为 `"private": true`，不会单独发布到 npm。它的代码会在
[`@wubafe/picasso-parse`](../picasso-parse) 编译时通过相对路径一并打入 `dist/`，
对外只暴露一个 npm 包入口（`picasso-parse/src/index.ts` 中 `export *` 转出本包）。

## 职责

接收 [`picasso-layout`](../picasso-layout) 处理后的 DSL，按目标平台生成具体代码：

- `picassoCode(data, size, platform)` —— 顶层分发入口，按 `CodeType` 路由
- `picassoWebCode(data, size)` —— `web/` 子模块，HTML + SCSS
- `picassoWeappCode(data, size)` —— `weapp/` 子模块，WXML + WXSS
- `picassoRNCode(data, size)` —— `reactnative/` 子模块，JSX + StyleSheet
- `handleClassName/` —— 跨平台共享的类名归一化策略

`size` 通常为画板宽度（375 / 750），决定是否注入 rem / rpx 适配。

## 上下游

- **被谁用**：`picasso-parse`（直接 `export *` 给最终消费者）
- **依赖谁**：`sketch-dsl`（`CodeType` 枚举）、`picasso-trans`（颜色 / 单位 / CSS 顺序等转换）

## 本地开发

```sh
cd packages/picasso-code-browser
npm install
npm run build   # tsc → dist/
```

详见 [Picasso 主仓库 README](../../README.md) 与 [@wubafe/picasso-parse](../picasso-parse)。
