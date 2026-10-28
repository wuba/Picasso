# 版本变更

## 0.2.0（2026-10-28）

### 新增

- 从包主入口导出 `analyzeRestoreVisuals` 及报告类型。在裁剪、切图整形和 RestoreDSL
  解析前采集原始视觉事实，保留原始精度、蒙版关系及复杂效果诊断。
- 报告独立于核心 RestoreDSL；默认采集文本，可通过 `includeText: false` 关闭。
  采集不修改输入，不依赖 Node 或 Sketch API。补拍范围是建议，不构成上传或还原门槛。

### 修复

- Semibold / DemiBold 正确识别为 `fontWeight: 600`。
- HTML 渲染器对整个多 run 文本执行 middle/bottom 垂直对齐；auto-width 禁止软换行并
  保留显式段落。每段独立消费对齐、行高，末尾空段继承最后分隔符样式。
- 图片填充分别支持 fill/fit/stretch/tile；多 fills 保留叠层顺序及每层独立的背景模式。

### 兼容性与限制

- 核心 `schemaVersion` 保持 `1.1`，不新增必填字段，不重写历史数据。
- 配对成功的 stableId 不变；字重修正会更新对应 contentHash/styleHash/subtreeHash。
  缺少 A 导出时，依赖内容指纹的 fallback ID 也可能变化，消费方应结合 parserVersion 判断。
- 四种存量解析入口以 0.1.2 固定夹具的完整输出摘要做兼容回归。
- 复杂径向渐变、patternTileScale、蒙版和混合模式仍需插件原生补拍或设计原图辅助；
  本版不承诺这些效果已精确渲染，也不代表完成真实 Sketch 像素验收。

### 打包

- `npm pack` 前自动构建并同步版本，排除测试夹具、嵌套 tarball 与仓库协作指令。
- 随包提供编译产物、类型声明、Schema、渲染规范及确定性渲染工具。
