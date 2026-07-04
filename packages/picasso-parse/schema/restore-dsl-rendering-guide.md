# RestoreDSL 渲染指南（消费端语义规范）

面向 RestoreDSL 的一切消费方：服务端 LLM 还原提示词、确定性渲染器
（`tools/gen_restore_html.py`）、diff 可视化等。**格式合法性**以
`restore-dsl.schema.json` 为准，本文回答的是「拿到合法数据后怎么渲染才对」。
两者须与 `RESTORE_SCHEMA_VERSION` 同步维护。

## 1. 总则

- 单位一律 pt（`meta.units`）；750 宽画板即 750pt，Web 端 1pt = 1px 直出即可。
- **画板背景**：`artboard.fills` 是页面底色，必须渲染；无 fills 时缺省**白底**
  （Sketch 画布语义），不能透出宿主页面背景。Sketch 2025 的 Frame 画板已由 parse
  归一化（type='artboard'、背景落 fills），消费方无需区分画板是 Artboard 还是 Frame。
- **缺省值省略**：`visible:true`、`rotation:0`、`opacity:1`、空数组一律不落盘。
  字段不存在 = 取默认值，不是数据缺失。
- 双坐标系：`frame` 是父级相对坐标（CSS 定位直接用）；`absFrame` 在
  **artboard 树里是画板绝对坐标**，在 **components[].tree 里是组件本地坐标**。
- `id` 是稳定 ID（跨版本 diff 用），渲染时仅当唯一 key 使用。
- `contentHash`/`subtreeHash`/`styleHash`/`constraints`/`componentKey`/`overrides`
  与渲染无关，可整段忽略（`toRenderProfile` 输出的精简视图已剥掉）。

## 2. 节点渲染决策树

按顺序判定，命中即止：

1. `type === 'slice'` → 无视觉，跳过。
2. `opacity === 0` → 不渲染整棵子树（占位层）。
3. **纯阴影矩形**：`type ∈ {rect, oval}` 且有 `shadows`、无 `fills`、
   `renderHint === 'image'` → 优先 CSS `box-shadow` 渲染（该类位图常被画板边缘
   裁切，CSS 更准）。
4. **位图节点**：`renderHint === 'image'` 或 `type === 'image'`，且有 `image.url`
   → 用位图渲染，**跳过矢量子树**（子树因布尔运算丢失等原因不保证可精确还原，
   `rasterizeReason` 说明栅格化原因）。摆放规则见 §3。
5. `type === 'text'` → 文本规则见 §5。
6. `type === 'path'` 且有 `svgPath` → 内联 SVG：`viewBox="0 0 w h"`，
   `preserveAspectRatio="none"`，`windingRule === 'evenodd'` 时加
   `fill-rule="evenodd"`。
7. `type ∈ {rect, oval}` → div + 背景/边框/圆角（oval 即 `border-radius: 50%`）。
8. `type === 'group'` → 容器 div，递归 children。语义见 §6。

## 3. 位图摆放（image.frame / scale）

- **优先用 `image.frame`**（schema 1.2+，插件端采集的画布真实渲染范围，画板绝对
  坐标）：位图画布可能含阴影/模糊 bleed，大于节点 frame 且**四边不对称**。
  换算父相对坐标：`left = image.frame.x - (absFrame.x - frame.x)`，top 同理，
  宽高直接用 `image.frame.w/h`。
- **位图已烘焙节点变换与着色**：导出位图包含 rotation / flip / 祖先 tint 的最终
  渲染效果（`image.frame` 也是变换后的画布范围）。摆放位图时**忽略**节点的
  rotation/flip 字段，不能再叠 CSS transform——会双重变换（实测 flip.y 箭头被翻回
  朝上）。这些字段仅供矢量化输出（读子树重建）时使用。
- `image.frame` 缺失时回退节点 `frame` 原位摆放（缺失的多为无 bleed 或 trim 已
  裁边的位图，回退无损）。不要自行做居中/阴影公式假设——历史上这两种假设都被
  实测推翻过（bleed 可以完全偏向一侧）。
- **回退摆位的物理约束**：确需按 PNG 实际尺寸回摆（PNG÷scale ≠ frame）而用阴影
  公式估 bleed 时，必须截断到物理可行域——单侧 bleed ≤ `PNG−frame` 的总差值，
  且不越过画板边缘（导出画布被画板裁切，`min(估值, 差值, absFrame.x/y)`）。
  实测案例：贴画板顶的全宽页头，阴影朝下，公式估出 bleed(10,8) 而真实是 (0,0)，
  不截断会整条偏移。
- 位图像素尺寸 = pt 尺寸 × 倍率。倍率取 `image.scale ?? meta.assetsScale`
  （节点级仅在与全局不同时落盘）。画板整图 `artboard.image` 有独立 scale
  （375 宽画板 2x，其余 1x）。
- `image.svgUrl` 存在时是同一切图的矢量版本，需要无损缩放时可优先。
- 已知噪声：切片被 Sketch 像素对齐，`image.frame` 与小数坐标节点可能有 ≤1pt
  漂移，属正常。

## 4. 样式映射

- **颜色**：`#RRGGBB` / `#RRGGBBAA` 8 位 hex，现代浏览器原生支持。
- **线性渐变**：`from`/`to` 是节点内单位坐标（y 向下）。CSS 角度 =
  `atan2(dx, -dy)`（度）。radial/angular 渐变较少见，可退化取首 stop 纯色，
  或按 CSS `radial-gradient` 尽力映射。
- **边框**：`position` 语义 CSS 没有直接对应，用 box-shadow 模拟不影响布局：
  `inside` → `inset 0 0 0 t`；`outside` → `0 0 0 t`（spread）；`center` →
  内外各半。border 属性会挤占盒模型，不要用。
- **阴影**：`shadows` → `box-shadow: x y blur spread color`；`innerShadows`
  同理加 `inset`。
- **圆角**：`borderRadius` 数组四角 `[tl, tr, br, bl]`，全等时可合并。
- **变换**：Sketch `rotation` 逆时针为正 → CSS `rotate(-r deg)`；`flip` →
  `scale(±1, ±1)`；`transform-origin: center`。
- **模糊**：`blur.type === 'Gaussian'` → `filter: blur(radius px)`；带 blur 的
  节点通常已被栅格化（走位图路径），矢量渲染时才需要处理。

## 5. 文本

- **行高兜底链**：`run.lineHeight ?? node.effectiveLineHeight ?? 本地近似`。
  `effectiveLineHeight`（1.2+）是 parse 侧算好的：单行 = frame 高（Sketch 实算
  默认行高），多行 ≈ 1.4 × 字号。不要用 1.2 × 字号的通用假设——PingFang 下
  实测偏小。
- 多 `runs` 按 `from`/`len` 切 span，只写与首 run 不同的属性。
- **文本图层 fills 覆盖 run 颜色**：text 节点存在纯色 `fills` 时，它是图层级
  填充覆盖（symbol 文本做颜色 override 的常见形态），**优先于所有 `runs[].color`**
  （实测："我的访客" run 色是 master 的 #FFFFFFA6，真实渲染色在 fills=#595959）。
  优先级：run 色 < 节点 fills < 祖先 tint（见 §6）。
- **保留显式换行**：`text` 里的 `\n` 是真实换行（多段落、竖排星号列全靠它定位），
  HTML 输出必须 `white-space: pre-wrap`（或 `\n`→`<br>`），默认的空白折叠会把
  段落挤成一坨。
- 对齐：`node.align ?? run.align ?? 'left'`；`verticalAlign` 默认 top。
- 单行判定：`textResizing !== 'auto-height'` 且 frame 高 < 行高 × 1.8 →
  `white-space: nowrap`（防意外折行）。
- 字体：`fontFamily` 落地时补中文兜底链
  `'PingFang SC', -apple-system, sans-serif`。

## 6. group 语义（1.2 重要变更）

- **`tint`**（1.2+）：普通编组的填充是**子图标着色提示**，不渲染为背景
  （渲染会出现色块）。1.1 老数据该提示仍在 `fills` 里——普通 group 的 `fills`
  一律不渲染为背景。
- **tint 要下发重着色**：不渲染为背景 ≠ 忽略。Sketch 的组填充语义是把子孙内容
  整体重着色为 tint 色（保留形状与 alpha）：渲染时将子孙矢量 fill / border /
  文本颜色替换为 tint 首个纯色（实测：状态栏 symbol 内容本体白色，靠组 tint
  #333333 染成深灰——不下发就是白字白底）。位图子节点已烘焙 tint，跳过。
  渐变 tint 罕见，可取首 stop 纯色近似。
- **Frame 容器不是普通编组**：Sketch 2025 Frame（含嵌套）的填充是**真实背景**，
  parse 已保持其 `fills` 语义（不落 tint），按普通背景渲染即可。
- **`shapeGroup: true`**：布尔运算形状组，其 `fills` 才是真实填充，children 是
  布尔子路径。`booleanOperation` 是字段透传（union/subtract/…），消费方不预合并
  ——无法合成路径时整组退化用位图（这类组通常已带 `image`）。
- **shapeGroup 无位图时的合成**：不要把 `fills` 涂成组包围盒（会出成色块）。
  可行近似：把全部子路径平移到组坐标系后拼进**同一个** `<path>`，
  `fill-rule="evenodd"`——subtract 的内路径自然成为挖洞（时钟/放大镜/ⓘ 类
  镂空 icon 实测正确）。注意 evenodd 只在单个 path 元素内生效，拆成多个
  `<path>` 不会挖洞。产物 svgPath 只含绝对 M/L/C/Z 命令，平移即给所有坐标
  加子节点 frame 偏移。
- **组阴影**：带 `shadows` 的 group 若 `renderHint === 'image'`，默认位图渲染
  （按 §3 摆位即精确）。需要**可编辑输出**时可改走「CSS box-shadow + 子树矢量」
  ——`shadows` 参数与 children 都在 JSON 里，三选一（位图 / CSS+子树 / 混合）
  由消费方按输出目标决定；位图始终是视觉对照的权威。

## 7. 组件与蒙版

- SymbolInstance 已内联展开：**实例节点的 children 是渲染权威**（overrides 已
  应用）；`components[componentKey].tree` 是 master 定义，仅供复用分析，渲染
  不要读它。
- mask 是 frame 裁剪近似（父容器 `overflow: hidden` 即可），非路径级镂空。

## 8. designTokens

`designTokens.colors` / `textStyles` 是高频值聚合（`fill.token` /
`run.styleToken` 反向引用）。渲染时不需要；生成**可维护代码**时应把 token 提为
CSS 变量/类，key 命名 `color-N` / `text-N`，`sourceName` 是 Sketch 共享样式原名。

## 9. 版本兼容

| schemaVersion | 消费端注意 |
| --- | --- |
| 1.0 | 无 renderHint/rasterizeReason；`fills[].image.url` 可能是本地相对路径（`meta.assetsBaseUrl` 拼接，该缺陷 1.1 起已修） |
| 1.1 | 普通 group 着色提示在 `fills`（同样不渲染）；无 image.frame/scale，位图 bleed 只能像素校准 |
| 1.2 | 本文完整语义：image.frame / effectiveLineHeight / tint / shapeGroup / styleHash / meta.assetsScale |
