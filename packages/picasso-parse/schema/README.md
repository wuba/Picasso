# RestoreDSL Schema

RestoreDSL（`picassoArtboardRestoreParse` 产物）的**格式与渲染语义规范**。随 npm tarball 一起分发，供服务端 / 渲染端 / 校验端直接取用。

## 文件

| 文件 | 作用 |
| --- | --- |
| [`restore-dsl.schema.json`](restore-dsl.schema.json) | 输出格式的**规范真源**（JSON Schema draft-07）。字段是否必填、枚举取值、缺省省略约定等以此为准 |
| [`restore-dsl-rendering-guide.md`](restore-dsl-rendering-guide.md) | **消费端渲染语义规范**——拿到合法 DSL 后怎么渲染才对。适用于所有 RestoreDSL 消费方：服务端 LLM 还原提示词、确定性渲染器（`tools/gen_restore_html.*`）、diff 可视化等 |

两者解决的问题不同：schema 回答「什么样的 JSON 是合法的」，rendering-guide 回答「合法 JSON 该怎么落到像素」。

## 校验产物合法性

```sh
# Python（内置 jsonschema）
python3 -m jsonschema -i your_restore.json restore-dsl.schema.json

# Node（ajv-cli）
npx ajv validate -s restore-dsl.schema.json -d your_restore.json
```

## 维护约定

- 与 `src/parseRestoreDSL/restoreTypes.ts` 的 `RESTORE_SCHEMA_VERSION`、`../tools/gen_restore_html.{py,js}` **四位一体同步更新**——改任一份必须同步其余三处。
- 只加字段升 minor；破坏性变更升 major（原则上禁止）。
- 缺省值省略原则：`visible:true` / `rotation:0` / `opacity:1` / `verticalAlign:'top'` / 空数组一律不写。字段不存在 = 取默认值，不是数据缺失。
- 语义收敛在 parse 端 `bake.ts` 单点，消费端零推断——本文档定义的行为不允许再兜底、再回退、再启发式。

服务端 LLM 提示词工程建议直接引用 `restore-dsl-rendering-guide.md` 全文作为素材源，避免二次转述引入偏差。
