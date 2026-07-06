#!/usr/bin/env node
/*
 * RestoreDSL(schemaVersion 1.0) -> 静态 HTML 还原稿生成器（确定性渲染基线, v4 削薄版）
 *
 * 模块拆分: 渲染核心(节点渲染/字体内联/位图回摆与像素校准)在 gen_restore_fragment.js,
 * 本文件只负责在其上组装「还原稿 vs 原设计图」对比页外壳。渲染语义变更须同步
 * gen_restore_fragment.js、schema/restore-dsl-rendering-guide.md 与 RESTORE_SCHEMA_VERSION；
 * 涉及对比页能力时再同步本文件。
 * 「只要还原稿」(片段/纯净页/fitWidth 自适应缩放)见 gen_restore_fragment.js。
 *
 * CLI 用法: node gen_restore_html.js <restore.json> <output.html>
 * API 用法(入库等场景直接拿 HTML 字符串):
 *   const { generateRestoreHtml } = require('./gen_restore_html');
 *   const html = await generateRestoreHtml(dsl, {          // dsl: RestoreDSL 对象或 JSON 字符串
 *     fontDir: '/path/a:/path/b',                          // 可选, 缺省读 PICASSO_FONT_DIR
 *     collectFixes: fixes,                                 // 可选, 传数组收集 [tag, msg] 修正记录
 *   });
 * 兼容: Node.js >= 14, 无必装依赖。
 *
 * fontDir 条目两种形态(可混用):
 *   - 本地目录: 递归找 <family>*.woff2/woff/ttf(老口径)
 *   - 字体文件完整 URL(https?://.../don58-Medium_V1.4.woff2): HTTP 无法枚举远程目录,
 *     所以远程只支持点名到文件; 按 URL 文件名做同样的 family/weight 匹配, 命中后
 *     整文件下载内联, 下载失败仅 log 不阻断。
 *   API 可直接传数组; 传字符串时, 含 '://' 用英文逗号分隔, 否则按老口径冒号分隔
 *   (URL 自身带冒号, 无法再用冒号分隔)。环境变量 PICASSO_FONT_DIR 同此规则。
 *
 * 定位: 模拟 LLM 消费者的确定性渲染器, 用于区分「数据不够还原」(改 parse/插件)
 * 与「LLM 没用好数据」(改提示词)。渲染语义规范见 schema/restore-dsl-rendering-guide.md。
 *
 * 实现说明:
 *   - 像素校准的可选依赖是 pngjs(npm i pngjs 即启用);
 *     未安装/无网络时自动降级为公式假设值。位图缩放用最近邻,
 *     校准是小范围位移搜索, 采样精度足够用于判断位移量级。
 *   - num() 的 %g 格式化在 >=1e6 时不转科学计数(px 坐标不会到该量级)。
 *   - round() 用四舍五入而非 Python 的银行家舍入(仅影响恰好半分位的极端值)。
 *
 * 字体嵌入: 设计稿常用私有字体(如 58 数字字体 don58)浏览器无内置, 回退 PingFang 后
 * 数字字形明显变宽。设环境变量 PICASSO_FONT_DIR(多目录冒号分隔), 脚本按 DSL 实际
 * 用到的 fontFamily 在目录下递归找 <family>*.woff2/woff/ttf, base64 内联为
 * @font-face; 找不到时仅 log 提示不阻断。
 */
'use strict';

const fs = require('fs');
const { createRestoreRenderContext, esc, num, styleAttr } = require('./gen_restore_fragment');

// ---------------- 主入口 ----------------

/**
 * RestoreDSL -> 还原稿 HTML 字符串。
 * @param {object|string} dslInput RestoreDSL 对象, 或其 JSON 字符串
 * @param {object} [options]
 * @param {string|string[]} [options.fontDir] 私有字体来源: 本地目录 或 字体文件完整 URL, 可混用;
 *   数组直接传, 字符串含 '://' 用逗号分隔、否则冒号分隔。缺省读环境变量 PICASSO_FONT_DIR
 * @param {Array}  [options.collectFixes] 传入数组则收集渲染期修正记录 [tag, msg]
 * @returns {Promise<string>} 完整 HTML 文档字符串
 */
async function generateRestoreHtml(dslInput, options) {
  const opts = options || {};
  // childIndent=3: 对比页里画板直接子节点的历史缩进深度, 保证产物逐字节不变
  const ctx = await createRestoreRenderContext(dslInput, {
    fontDir: opts.fontDir,
    collectFixes: opts.collectFixes,
    childIndent: 3,
  });

  const DSL = ctx.DSL;
  const ART = ctx.ART;
  const ART_W = ctx.width;
  const ART_H = ctx.height;
  const bodyNodes = ctx.bodyNodes;
  const artStyles = ctx.artStyles;
  const origUrl = ctx.origUrl;
  const title = ctx.title;
  const fontFaces = ctx.fontFaces;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${esc(title)} · RestoreDSL 还原稿</title>
<style>
${fontFaces}
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #2b2d31; font-family: 'PingFang SC', -apple-system, sans-serif; }
  .toolbar {
    position: sticky; top: 0; z-index: 100; display: flex; gap: 16px; align-items: center;
    padding: 10px 20px; background: #1e1f22; color: #ddd; font-size: 13px;
    border-bottom: 1px solid #000;
  }
  .toolbar label { display: flex; gap: 6px; align-items: center; cursor: pointer; }
  .toolbar select, .toolbar input[type=range] { cursor: pointer; }
  .stage { display: flex; justify-content: center; padding: 24px; }
  .wrap { position: relative; transform-origin: top center; flex: none; box-shadow: 0 4px 24px rgba(0,0,0,.5); }
  .artboard { overflow: hidden; }
  .n { position: absolute; }
  .txt { pointer-events: none; }
  .img { object-fit: contain; }
  #origImg {
    position: absolute; left: 0; top: 0; width: ${num(ART_W)}px; height: ${num(ART_H)}px;
    pointer-events: none; display: none;
  }
  body.mode-orig #restore { visibility: hidden; }
  body.mode-orig #origImg { display: block; }
  body.mode-overlay #origImg { display: block; }
</style>
</head>
<body class="mode-restore">
<div class="toolbar">
  <strong>${esc(title)}</strong>
  <label>模式
    <select id="mode">
      <option value="restore">还原稿</option>
      <option value="orig">原设计图</option>
      <option value="overlay">叠加对比</option>
    </select>
  </label>
  <label id="opWrap" style="display:none">原图透明度
    <input type="range" id="op" min="0" max="100" value="50">
  </label>
  <label>缩放
    <select id="zoom">
      <option value="0.5" selected>50%</option>
      <option value="0.75">75%</option>
      <option value="1">100%</option>
    </select>
  </label>
  <span style="opacity:.5">${num(ART_W)} × ${num(ART_H)} · schemaVersion ${esc(String(DSL.schemaVersion))} · parser ${esc(DSL.meta.parserVersion != null ? DSL.meta.parserVersion : '')}</span>
</div>
<div class="stage">
  <div class="wrap" id="wrap" style="width:${num(ART_W)}px; height:${num(ART_H)}px">
    <div class="artboard" id="restore" data-dsl-id="${esc(ART.id)}" style="${styleAttr(artStyles)}">
${bodyNodes}    </div>
    <img id="origImg" src="${origUrl}" alt="原设计图">
  </div>
</div>
<script>
  const modeSel = document.getElementById('mode');
  const zoomSel = document.getElementById('zoom');
  const op = document.getElementById('op');
  const opWrap = document.getElementById('opWrap');
  const wrap = document.getElementById('wrap');
  const origImg = document.getElementById('origImg');
  function apply() {
    document.body.className = 'mode-' + modeSel.value;
    opWrap.style.display = modeSel.value === 'overlay' ? 'flex' : 'none';
    origImg.style.opacity = modeSel.value === 'overlay' ? op.value / 100 : 1;
    const z = parseFloat(zoomSel.value);
    wrap.style.transform = 'scale(' + z + ')';
    wrap.style.marginBottom = ((z - 1) * ${num(ART_H)}) + 'px';
  }
  modeSel.onchange = zoomSel.onchange = op.oninput = apply;
  apply();
</script>
</body>
</html>
`;
}

module.exports = { generateRestoreHtml };

// ---------------- CLI ----------------

if (require.main === module) {
  const SRC = process.argv[2];
  const OUT = process.argv[3];
  if (!SRC || !OUT) {
    console.error('用法: node gen_restore_html.js <restore.json> <output.html>');
    process.exit(1);
  }
  const fixes = [];
  generateRestoreHtml(fs.readFileSync(SRC, 'utf8'), { collectFixes: fixes })
    .then((html) => {
      fs.writeFileSync(OUT, html);
      // 字符数口径，便于人工核对输出规模
      console.log('written: ' + OUT + ' (' + html.length + ' bytes)');
      for (const fix of fixes) {
        console.log('[fix:' + fix[0] + '] ' + fix[1]);
      }
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
