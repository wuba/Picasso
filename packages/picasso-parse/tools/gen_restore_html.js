#!/usr/bin/env node
/*
 * RestoreDSL(schemaVersion 1.0) -> 静态 HTML 还原稿生成器（确定性渲染基线, v4 削薄版）
 * gen_restore_html.py 的 Node.js 等价实现, 与 Python 版逐行对齐、输出逐字节一致
 * （像素校准命中的节点除外, 见下）。两版需同步维护, 渲染语义变更必须双边同改。
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
 * 与 Python 版的实现差异(均不影响正常产物):
 *   - 像素校准的可选依赖是 pngjs(npm i pngjs 即启用), 对应 Python 版的 Pillow;
 *     未安装/无网络时同样自动降级为公式假设值。位图缩放用最近邻(Pillow 为双三次),
 *     校准是小范围位移搜索, 采样精度差异不影响搜索结果的量级。
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
const path = require('path');
const http = require('http');
const https = require('https');

// ---------------- 工具函数(无 DSL 状态) ----------------

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function num(v) {
  // 去掉多余小数位(对齐 Python 的 int 直出 + '%g' 6 位有效数字)
  if (typeof v !== 'number') return String(v);
  if (Number.isInteger(v)) return String(v);
  return String(Number(v.toPrecision(6)));
}

function round(v, digits) {
  const k = Math.pow(10, digits);
  return Math.round(v * k) / k;
}

function px(v) {
  return num(v) + 'px';
}

function colorCss(hexs) {
  // #RRGGBB / #RRGGBBAA 直接输出，现代浏览器原生支持 8 位 hex
  return hexs;
}

function gradientCss(g) {
  // 线性渐变直接消费 gradient.css(parse 端 bake 已按节点实际宽高投影算好,
  // pct 可为负/超 100, 浏览器沿渐变线外推)。无 css 字段(非线性/退化)取首色纯背景。
  const css = g.css;
  if (!css) return colorCss(g.stops[0].color);
  const stops = css.stops.map((s) => colorCss(s.color) + ' ' + num(s.pct) + '%').join(', ');
  return 'linear-gradient(' + num(css.angle) + 'deg, ' + stops + ')';
}

function fillToBg(fill) {
  // 单个 fill -> (background-color / background-image) css 片段列表
  if ('color' in fill) return [['background-color', colorCss(fill.color)]];
  if ('gradient' in fill) {
    const g = fill.gradient;
    if (g.type === 'linear') return [['background-image', gradientCss(g)]];
    // 非线性渐变兜底: 取第一个 stop 颜色
    return [['background-color', colorCss(g.stops[0].color)]];
  }
  if ('image' in fill) {
    return [
      ['background-image', "url('" + fill.image.url + "')"],
      ['background-size', 'cover'],
      ['background-position', 'center'],
    ];
  }
  return [];
}

function bordersToCss(node, styles) {
  // borders/shadows -> box-shadow 模拟(不影响布局)。
  // 边框: inside=inset, outside=spread, center=对半; 投影: 直接映射 drop shadow
  const shadows = [];
  for (const s of node.shadows || []) {
    shadows.push(
      px(s.x != null ? s.x : 0) + ' ' + px(s.y != null ? s.y : 0) + ' ' +
      px(s.blur != null ? s.blur : 0) + ' ' + px(s.spread != null ? s.spread : 0) + ' ' +
      colorCss(s.color));
  }
  for (const b of node.borders || []) {
    const c = colorCss(b.color);
    const t = b.thickness;
    const pos = b.position || 'center';
    if (pos === 'inside') {
      shadows.push('inset 0 0 0 ' + px(t) + ' ' + c);
    } else if (pos === 'outside') {
      shadows.push('0 0 0 ' + px(t) + ' ' + c);
    } else { // center: 内外各一半
      shadows.push('inset 0 0 0 ' + px(t / 2) + ' ' + c);
      shadows.push('0 0 0 ' + px(t / 2) + ' ' + c);
    }
  }
  if (shadows.length) styles.push(['box-shadow', shadows.join(', ')]);
}

function radiusCss(node, styles, isOval) {
  if (isOval) {
    styles.push(['border-radius', '50%']);
    return;
  }
  const br = node.borderRadius;
  if (br && br.length) {
    if (new Set(br).size === 1) styles.push(['border-radius', px(br[0])]);
    else styles.push(['border-radius', br.map((v) => px(v)).join(' ')]);
  }
}

function transformCss(node, styles) {
  // [修正] Sketch 语义: flip 在世界坐标系下, rotation 是最终旋转角 → 先 rotate 后 flip。
  // CSS transform 矩阵从右到左应用, 所以要写成 'scale(...) rotate(...)' (scale 在左, rotate
  // 在右) 才能让 rotate 先应用于图形。
  // 旧写法 'rotate(...) scale(...)' 语义颠倒:
  //   案例 <"箭头 (01/09/15 左上): 两条 4x24 rect, rot=-45, 其中一条 flip.y。
  //   Sketch 语义: 竖长条 rotate → "/" → flip.y → "\", 组合得 "<";
  //   旧 CSS 顺序: flip.y (对称长条无变化) → rotate → "/", 两条都渲成 "/", 变成 "/"。
  const parts = [];
  const rot = node.rotation;
  const flip = node.flip;
  if (flip) {
    const sx = flip.x ? -1 : 1;
    const sy = flip.y ? -1 : 1;
    if (sx !== 1 || sy !== 1) parts.push('scale(' + sx + ', ' + sy + ')');
  }
  if (rot) parts.push('rotate(' + num(-rot) + 'deg)'); // Sketch 逆时针为正 -> CSS 取负
  if (parts.length) {
    styles.push(['transform', parts.join(' ')]);
    styles.push(['transform-origin', 'center']);
  }
}

function baseStyles(node) {
  const f = node.frame;
  const styles = [
    ['left', px(f.x)],
    ['top', px(f.y)],
    ['width', px(f.w)],
    ['height', px(f.h)],
  ];
  if (node.opacity != null) styles.push(['opacity', num(node.opacity)]);
  transformCss(node, styles);
  return styles;
}

function styleAttr(styles) {
  return styles.map((kv) => kv[0] + ': ' + kv[1]).join('; ');
}

// ---------------- HTTP 工具(Node 14 无 fetch) ----------------

function httpGet(url, opts) {
  // opts: {headers, timeout, maxBytes}; 跟随重定向(对齐 Python urllib 默认行为)。
  // 任何失败都 resolve(null), 调用方按降级路径处理。
  const timeout = (opts && opts.timeout) || 10000;
  const maxBytes = opts && opts.maxBytes;
  const headers = (opts && opts.headers) || {};
  return new Promise((resolve) => {
    const go = (u, redirectsLeft) => {
      let mod;
      try {
        mod = new URL(u).protocol === 'https:' ? https : http;
      } catch (e) {
        return resolve(null);
      }
      const req = mod.get(u, { headers, timeout }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirectsLeft > 0) {
          res.resume();
          return go(new URL(res.headers.location, u).toString(), redirectsLeft - 1);
        }
        if (res.statusCode !== 200 && res.statusCode !== 206) {
          res.resume();
          return resolve(null);
        }
        const chunks = [];
        let size = 0;
        res.on('data', (c) => {
          chunks.push(c);
          size += c.length;
          if (maxBytes && size >= maxBytes) { // 只要头部时读够即断开(Range 被忽略也不拉全文件)
            resolve(Buffer.concat(chunks));
            req.destroy();
          }
        });
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', () => resolve(null));
      });
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
      req.on('error', () => resolve(null));
    };
    go(url, 5);
  });
}

// ---------------- 私有字体嵌入 ----------------
// 浏览器无内置的设计稿字体(don58 等)按需内联, 否则回退 PingFang 导致数字字宽失真
const FONT_WEIGHT_HINTS = [['thin', 100], ['extralight', 200], ['light', 300],
                           ['medium', 500], ['semibold', 600], ['bold', 700],
                           ['black', 900], ['regular', 400]];
const FONT_MIME = { '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };

function usedFontFamilies(node, acc) {
  for (const r of node.runs || []) {
    if (r.fontFamily) acc.add(r.fontFamily);
  }
  for (const c of node.children || []) usedFontFamilies(c, acc);
}

function* walkFiles(root) {
  // 对齐 os.walk 的 top-down 顺序: 先当前目录文件, 再递归子目录
  let entries;
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch (e) {
    return;
  }
  for (const e of entries) {
    if (e.isFile()) yield path.join(root, e.name);
  }
  for (const e of entries) {
    if (e.isDirectory()) yield* walkFiles(path.join(root, e.name));
  }
}

// ---------------- 位图解码(像素校准用, pngjs 可选) ----------------
// bleed 回摆的方向假设(居中/阴影公式)不总成立: 例如头像组的在线状态点让 bleed 全在右下。
// 校准: 与画板原始截图做小范围位移搜索, 用实测位移落位。依赖 pngjs + 网络, 失败自动回退假设值。
let PNG = null;
try {
  PNG = require('pngjs').PNG; // 可选依赖, 对应 Python 版的 Pillow
} catch (e) {
  PNG = null;
}

function decodeRgb(buf) {
  // PNG Buffer -> {width, height, data: RGB Uint8Array}; 失败返回 null
  if (!PNG || !buf) return null;
  try {
    const img = PNG.sync.read(buf); // RGBA
    const n = img.width * img.height;
    const rgb = new Uint8Array(n * 3);
    for (let i = 0; i < n; i++) {
      rgb[i * 3] = img.data[i * 4];
      rgb[i * 3 + 1] = img.data[i * 4 + 1];
      rgb[i * 3 + 2] = img.data[i * 4 + 2];
    }
    return { width: img.width, height: img.height, data: rgb };
  } catch (e) {
    return null;
  }
}

function resizeRgb(img, w, h) {
  // 最近邻缩放(校准只做位移搜索, 采样精度要求低)
  if (img.width === w && img.height === h) return img;
  const out = new Uint8Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(img.height - 1, Math.floor(y * img.height / h));
    for (let x = 0; x < w; x++) {
      const sx = Math.min(img.width - 1, Math.floor(x * img.width / w));
      const si = (sy * img.width + sx) * 3;
      const di = (y * w + x) * 3;
      out[di] = img.data[si];
      out[di + 1] = img.data[si + 1];
      out[di + 2] = img.data[si + 2];
    }
  }
  return { width: w, height: h, data: out };
}

function cropRgbBytes(img, x0, y0, w, h) {
  const out = new Uint8Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    const si = ((y0 + y) * img.width + x0) * 3;
    out.set(img.data.subarray(si, si + w * 3), y * w * 3);
  }
  return out;
}

function translateD(d, tx, ty) {
  // 平移 svgPath(实测产物只含绝对 M/L/C/Z, 所有数字均为坐标对)
  if (!tx && !ty) return d;
  let idx = 0;
  return d.replace(/-?\d+\.?\d*(?:e-?\d+)?/g, (m) => {
    const v = parseFloat(m) + (idx % 2 === 0 ? tx : ty);
    idx += 1;
    return num(round(v, 4));
  });
}

function childPathD(c) {
  // shapeGroup 子节点 -> 组本地坐标系的 path d; 不支持的返回 null
  const f = c.frame;
  if (c.rotation || c.flip) return null;
  if (c.type === 'path' && c.svgPath) {
    // svgPath 是子节点本地坐标, 平移到组坐标系后拼进同一个 <path>
    return translateD(c.svgPath, f.x, f.y);
  }
  if (c.type === 'oval') {
    const k = 0.5523;
    const rx = f.w / 2;
    const ry = f.h / 2;
    const cx = f.x + rx;
    const cy = f.y + ry;
    const n = (v) => num(round(v, 3));
    return 'M' + n(cx - rx) + ' ' + n(cy) + ' ' +
      'C' + n(cx - rx) + ' ' + n(cy - k * ry) + ' ' + n(cx - k * rx) + ' ' + n(cy - ry) + ' ' + n(cx) + ' ' + n(cy - ry) + ' ' +
      'C' + n(cx + k * rx) + ' ' + n(cy - ry) + ' ' + n(cx + rx) + ' ' + n(cy - k * ry) + ' ' + n(cx + rx) + ' ' + n(cy) + ' ' +
      'C' + n(cx + rx) + ' ' + n(cy + k * ry) + ' ' + n(cx + k * rx) + ' ' + n(cy + ry) + ' ' + n(cx) + ' ' + n(cy + ry) + ' ' +
      'C' + n(cx - k * rx) + ' ' + n(cy + ry) + ' ' + n(cx - rx) + ' ' + n(cy + k * ry) + ' ' + n(cx - rx) + ' ' + n(cy) + ' Z';
  }
  if (c.type === 'rect' && !(c.borderRadius && c.borderRadius.length)) {
    return 'M' + num(f.x) + ' ' + num(f.y) + ' L' + num(f.x + f.w) + ' ' + num(f.y) + ' ' +
           'L' + num(f.x + f.w) + ' ' + num(f.y + f.h) + ' L' + num(f.x) + ' ' + num(f.y + f.h) + ' Z';
  }
  return null;
}

function shapegroupSvg(node, indent) {
  // 无位图 shapeGroup: 子路径拼进一个 SVG, fill-rule=evenodd 近似布尔运算
  // (subtract 的内路径成为挖洞)。返回 null 表示无法合成, 由调用方走逐子路径填色回退。
  const kids = node.children || [];
  if (!kids.length) return null;
  let fill = null;
  for (const fl of node.fills || []) {
    if ('color' in fl) {
      fill = fl.color;
      break;
    }
  }
  if (!fill) return null;
  const parts = [];
  for (const c of kids) {
    const p = childPathD(c);
    if (p === null) return null;
    parts.push(p);
  }
  const f = node.frame;
  const styles = baseStyles(node);
  let stroke = '';
  for (const b of node.borders || []) {
    stroke = ' stroke="' + colorCss(b.color) + '" stroke-width="' + num(b.thickness) + '"';
    break;
  }
  // 全部子路径拼进同一个 <path>: fill-rule=evenodd 只在单个 path 元素内生效,
  // 跨元素不会挖洞(时钟/放大镜/ⓘ 等 subtract icon 会被填成实心)
  const combined = parts.join(' ');
  const pad = '  '.repeat(indent);
  return pad + '<svg class="n" data-name="' + esc(node.name) + '" style="' + styleAttr(styles) + '" ' +
         'viewBox="0 0 ' + num(f.w) + ' ' + num(f.h) + '" preserveAspectRatio="none">' +
         '<path d="' + combined + '" fill="' + colorCss(fill) + '" fill-rule="evenodd"' + stroke + '/></svg>\n';
}

function renderPath(node, indent) {
  const f = node.frame;
  const styles = baseStyles(node);
  let fill = 'none';
  for (const fl of node.fills || []) {
    if ('color' in fl) {
      fill = colorCss(fl.color);
      break;
    }
  }
  let stroke = '';
  for (const b of node.borders || []) {
    stroke = ' stroke="' + colorCss(b.color) + '" stroke-width="' + num(b.thickness) + '"';
    break;
  }
  const rule = node.windingRule === 'evenodd' ? ' fill-rule="evenodd"' : '';
  // 描边骑线(center)会向 frame 外溢出半个 thickness, svg 默认 overflow:hidden 会裁掉
  // (案例: 4px stroke 画在 1px 高 viewBox 里只剩 1px)——描边路径放开裁剪
  if (stroke) styles.push(['overflow', 'visible']);
  const pad = '  '.repeat(indent);
  return pad + '<svg class="n" data-name="' + esc(node.name) + '" style="' + styleAttr(styles) + '" ' +
         'viewBox="0 0 ' + num(f.w) + ' ' + num(f.h) + '" preserveAspectRatio="none">' +
         '<path d="' + node.svgPath + '" fill="' + fill + '"' + rule + stroke + '/></svg>\n';
}

function renderShape(node, indent, extraClass) {
  // rect / oval / 有 fills 的 group 背景
  if (extraClass === undefined) extraClass = '';
  const styles = baseStyles(node);
  for (const fl of node.fills || []) {
    for (const kv of fillToBg(fl)) styles.push(kv);
  }
  bordersToCss(node, styles);
  radiusCss(node, styles, node.type === 'oval');
  const pad = '  '.repeat(indent);
  return pad + '<div class="n ' + extraClass + '" data-name="' + esc(node.name) + '" ' +
         'style="' + styleAttr(styles) + '"></div>\n';
}

// 需要提到顶层 z-index 的节点(在原 JSON 里层级偏低会被后续白底盖住)
const Z_FIX = {};

// ---------------- 手工修正 ----------------
// (曾尝试把「消息提醒」徽标 z-index 提升到底 bar 之上, 但与原设计图截图比对后
//  确认 Sketch 原始渲染中徽标就是被底 bar 白底盖住的, 忠实还原应保持 DSL 图层顺序,
//  故撤销该改动。详见还原修正记录文档。)

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
  const DSL = typeof dslInput === 'string' ? JSON.parse(dslInput) : dslInput;

  const ART = DSL.artboard;
  const ART_W = ART.frame.w;
  const ART_H = ART.frame.h;

  // 修正记录: 生成期间自动记录的修正项 (由人工整理进文档)
  const FIXES = opts.collectFixes || [];

  function logFix(tag, msg) {
    FIXES.push([tag, msg]);
  }

  async function buildFontFaces() {
    // 按 DSL 用到的 fontFamily 找字体文件, 内联 @font-face。来源条目两种形态(可混用):
    // 本地目录(递归找 <family>*.woff2/woff/ttf) / 字体文件完整 URL(HTTP 无法枚举
    // 远程目录, 远程只支持点名到文件, 按 URL 文件名做同样匹配, 命中后下载内联)。
    // 同 family 多 weight 各出一条(文件名含 Medium/Bold 等权重提示词); 同 weight
    // 多格式时取 woff2 > woff > ttf。
    const raw = opts.fontDir != null ? opts.fontDir : (process.env.PICASSO_FONT_DIR || '');
    // 字符串形态: URL 自身带冒号, 含 '://' 时改用逗号分隔, 纯本地目录保持冒号老口径
    const entries = Array.isArray(raw)
      ? raw.filter((d) => d != null && String(d).trim())
      : String(raw).split(String(raw).indexOf('://') >= 0 ? ',' : ':').filter((d) => d.trim());
    if (!entries.length) return '';
    const famSet = new Set();
    usedFontFamilies(ART, famSet);
    // 系统字体无需嵌入: .SFNS(苹果系统字面名)与 PingFang 系 macOS/iOS 自带
    const fams = Array.from(famSet)
      .filter((f) => !f.startsWith('.') && !f.toLowerCase().includes('pingfang'))
      .sort();
    const faces = [];
    for (const fam of fams) {
      const found = new Map(); // weight -> [ext_priority, {url|path, name}]
      for (const entry of entries) {
        const e = String(entry).trim();
        if (/^https?:\/\//i.test(e)) {
          let fn;
          try {
            fn = decodeURIComponent(new URL(e).pathname.split('/').pop() || '');
          } catch (err) {
            continue;
          }
          const ext = path.extname(fn).toLowerCase();
          if (!(ext in FONT_MIME) || !fn.toLowerCase().startsWith(fam.toLowerCase())) continue;
          let weight = 400;
          for (const hw of FONT_WEIGHT_HINTS) {
            if (fn.toLowerCase().includes(hw[0])) {
              weight = hw[1];
              break;
            }
          }
          const prio = ['.woff2', '.woff', '.ttf'].indexOf(ext);
          if (!found.has(weight) || prio < found.get(weight)[0]) found.set(weight, [prio, { url: e, name: fn }]);
        } else {
          for (const fp of walkFiles(entry)) {
            const fn = path.basename(fp);
            const ext = path.extname(fn).toLowerCase();
            if (!(ext in FONT_MIME) || !fn.toLowerCase().startsWith(fam.toLowerCase())) continue;
            let weight = 400;
            for (const hw of FONT_WEIGHT_HINTS) {
              if (fn.toLowerCase().includes(hw[0])) {
                weight = hw[1];
                break;
              }
            }
            const prio = ['.woff2', '.woff', '.ttf'].indexOf(ext);
            if (!found.has(weight) || prio < found.get(weight)[0]) found.set(weight, [prio, { path: fp, name: fn }]);
          }
        }
      }
      for (const weight of Array.from(found.keys()).sort((a, b) => a - b)) {
        const src = found.get(weight)[1];
        let buf;
        if (src.url) {
          buf = await httpGet(src.url, { timeout: 15000 });
          if (!buf) {
            logFix('font-missing', '字体文件下载失败 ' + src.url + ', 跳过');
            continue;
          }
        } else {
          buf = fs.readFileSync(src.path);
        }
        const b64 = buf.toString('base64');
        const ext = path.extname(src.name).toLowerCase();
        const fmt = { '.woff2': 'woff2', '.woff': 'woff', '.ttf': 'truetype' }[ext];
        faces.push(
          "  @font-face { font-family: '" + fam + "'; font-weight: " + weight + '; ' +
          'src: url(data:' + FONT_MIME[ext] + ';base64,' + b64 + ") format('" + fmt + "'); }");
        logFix('font-embed', '内联字体 ' + fam + ' weight=' + weight + ' <- ' + src.name);
      }
      if (!found.size) {
        logFix('font-missing', "字体 '" + fam + "' 在 PICASSO_FONT_DIR 未找到, 将回退 PingFang(字宽可能失真)");
      }
    }
    return faces.join('\n');
  }

  // ---------------- 位图尺寸感知 ----------------
  // 切图统一导出倍率从 meta.assetsScale 读; 老数据缺省按 750 宽画板 @2x 惯例
  const ASSETS_SCALE = ((DSL.meta || {}).assetsScale) || 2;

  function imageScale(node) {
    // 节点级 image.scale 优先(与全局不同时才落盘), 否则用 meta.assetsScale
    return ((node.image || {}).scale) || ASSETS_SCALE;
  }

  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const _pngSizeCache = new Map();

  async function pngSize(url) {
    // 只下载 PNG 头部读 IHDR 宽高; 失败返回 null
    if (_pngSizeCache.has(url)) return _pngSizeCache.get(url);
    let size = null;
    const head = await httpGet(url, { headers: { Range: 'bytes=0-40' }, timeout: 10000, maxBytes: 41 });
    if (head && head.length >= 24 &&
        head.slice(0, 8).equals(PNG_SIG) && head.slice(12, 16).toString('latin1') === 'IHDR') {
      size = [head.readUInt32BE(16), head.readUInt32BE(20)];
    }
    _pngSizeCache.set(url, size);
    return size;
  }

  // ---------------- 像素校准 ----------------
  let _artImg = 'UNINIT';
  const _bitmapCache = new Map();

  async function artboardPixels() {
    if (_artImg !== 'UNINIT') return _artImg;
    let img = null;
    const url = (ART.image || {}).url;
    if (PNG && url) {
      const buf = await httpGet(url, { timeout: 15000 });
      img = decodeRgb(buf);
      if (img && (img.width !== Math.round(ART_W) || img.height !== Math.round(ART_H))) {
        img = resizeRgb(img, Math.round(ART_W), Math.round(ART_H));
      }
    }
    _artImg = img;
    return img;
  }

  async function calibratePlacement(url, gx, gy, rw, rh, dxRange, dyRange) {
    // 在物理可行域内搜索位图与原图的最佳对齐位移; 返回 [dx,dy] 或 null。
    // 可行域约束: 导出位图范围必然包含图层 frame, 位移不能超过 bleed 量本身,
    // 否则会把低对比区域的噪声拟合成大偏移。
    const art = await artboardPixels();
    if (art === null) return null;
    try {
      if (!_bitmapCache.has(url)) {
        const buf = await httpGet(url, { timeout: 15000 });
        _bitmapCache.set(url, decodeRgb(buf));
      }
      const bm = _bitmapCache.get(url);
      if (!bm) return null;
      const sp = resizeRgb(bm, Math.max(1, Math.round(rw)), Math.max(1, Math.round(rh)));
      const a = sp.data;
      const step = Math.max(1, Math.floor(a.length / 3 / 4000)) * 3 + 1; // 大图降采样, 控制每次比较 ~4k 像素内
      let best = null;
      for (let dy = dyRange[0]; dy <= dyRange[1]; dy++) {
        for (let dx = dxRange[0]; dx <= dxRange[1]; dx++) {
          const x0 = Math.round(gx) + dx;
          const y0 = Math.round(gy) + dy;
          if (x0 < 0 || y0 < 0 || x0 + sp.width > art.width || y0 + sp.height > art.height) continue;
          const b = cropRgbBytes(art, x0, y0, sp.width, sp.height);
          let d = 0;
          for (let i = 0; i < a.length; i += step) {
            const t = a[i] - b[i];
            d += t * t;
          }
          if (best === null || d < best[0]) best = [d, dx, dy];
        }
      }
      return best ? [best[1], best[2]] : null;
    } catch (e) {
      return null;
    }
  }

  // ---------------- 各类型渲染 ----------------

  async function renderImageNode(node, indent) {
    // renderHint=image / type=image 的栅格化节点: 直接用位图, 跳过矢量子树。
    // 位图可能带 bleed(阴影/模糊溢出图层 frame), 按真实渲染尺寸回摆:
    // - 有 image.frame: 插件端采集的画布真实范围(画板绝对坐标), 直接换算摆位
    // - 老数据回退: 有 shadows 按 blur/offset 公式外扩, 否则居中假设 + 像素校准
    const f = node.frame;
    const af = node.absFrame || f;
    let styles = baseStyles(node);
    // 位图 transform 契约(beta.6 定稿): 切图是 Sketch 渲染管线产物, 图层自身变换
    // 必烘焙进像素, parse 端 bake 对带 url 节点(含 group/shapeGroup)已删 rotation/
    // flip; 产物里字段出现即必须应用, 渲染端零启发式。勘误: 曾据"01 气泡需 CSS 再
    // 翻转"判定 group 位图未烘焙, 同一 URL 数据复核证实为误判(切图与原图尖角方向
    // 本就一致, 再翻反而双重翻转)。前提: 插件收口在 URL 回填后重跑 bakeRestoreTree。
    const url = node.image.url;

    const imf = node.image.frame;
    if (imf) {
      // image.frame 是画板绝对坐标, 减去父级偏移(absFrame - frame)得父相对坐标
      const offX = af.x - f.x;
      const offY = af.y - f.y;
      styles = styles.filter((kv) => ['left', 'top', 'width', 'height'].indexOf(kv[0]) < 0);
      styles = [['left', px(imf.x - offX)], ['top', px(imf.y - offY)],
                ['width', px(imf.w)], ['height', px(imf.h)]].concat(styles);
      if (Math.abs(imf.w - f.w) > 0.25 || Math.abs(imf.h - f.h) > 0.25) {
        logFix('bleed', "位图回摆 '" + node.name + "': frame " + f.w + 'x' + f.h + ' -> ' +
                        '渲染 ' + num(imf.w) + 'x' + num(imf.h) + ' [image.frame]');
      }
      // 交叉验证: PNG 实际尺寸应与 image.frame 一致(允许像素对齐误差)
      const nat = await pngSize(url);
      if (nat) {
        const sc = imageScale(node);
        const rw = nat[0] / sc;
        const rh = nat[1] / sc;
        if (Math.abs(rw - imf.w) > 0.6 || Math.abs(rh - imf.h) > 0.6) {
          logFix('bleed-verify', "警告 '" + node.name + "': image.frame " +
                                 num(imf.w) + 'x' + num(imf.h) + ' 与 PNG 实际 ' + num(rw) + 'x' + num(rh) + ' 不符');
        }
      }
      radiusCss(node, styles, node.type === 'oval');
      const pad = '  '.repeat(indent);
      return pad + '<img class="n img" data-name="' + esc(node.name) + '" ' +
             'src="' + url + '" style="' + styleAttr(styles) + '" alt="">\n';
    }

    const nat = await pngSize(url);
    if (nat) {
      const sc = imageScale(node);
      const rw = nat[0] / sc;
      const rh = nat[1] / sc;
      if (Math.abs(rw - f.w) > 0.25 || Math.abs(rh - f.h) > 0.25) {
        // 位图含 bleed, 重算摆放位置: 先按 阴影公式/居中 假设, 再与原图做像素校准
        let bleedL;
        let bleedT;
        if (node.shadows && node.shadows.length) {
          const s = node.shadows[0];
          bleedL = s.blur - (s.x != null ? s.x : 0) + (s.spread != null ? s.spread : 0);
          bleedT = s.blur - (s.y != null ? s.y : 0) + (s.spread != null ? s.spread : 0);
          // 物理约束截断: 单侧 bleed 不可能超过 PNG 与 frame 的总差值,
          // 也不可能越过画板边缘(导出画布被画板裁切)。实测: 贴画板顶的全宽页头
          // 阴影朝下, 公式假设 bleed(10,8) 而真实 (0,0), 不截断会整条偏移。
          const rawL = bleedL;
          const rawT = bleedT;
          bleedL = Math.max(0.0, Math.min(bleedL, rw - f.w, af.x));
          bleedT = Math.max(0.0, Math.min(bleedT, rh - f.h, af.y));
          if (rawL !== bleedL || rawT !== bleedT) {
            logFix('bleed-clamp', "'" + node.name + "' 阴影公式 bleed(" + num(rawL) + ',' + num(rawT) + ') ' +
                                  '按物理约束截断为 (' + num(bleedL) + ',' + num(bleedT) + ')');
          }
        } else {
          bleedL = (rw - f.w) / 2;
          bleedT = (rh - f.h) / 2;
        }
        let note = '假设';
        // 可行域: 0 <= bleed_l - dx <= rw - w (位图必须完整覆盖 frame), 上限 ±8 防超大 bleed 全域搜索
        const bw = rw - f.w;
        const bh = rh - f.h;
        const dxr = [Math.max(-8, Math.ceil(bleedL - bw)), Math.min(8, Math.floor(bleedL))];
        const dyr = [Math.max(-8, Math.ceil(bleedT - bh)), Math.min(8, Math.floor(bleedT))];
        let shift = null;
        if (dxr[1] > dxr[0] || dyr[1] > dyr[0]) { // 有可挪空间才搜索
          shift = await calibratePlacement(url, af.x - bleedL, af.y - bleedT, rw, rh, dxr, dyr);
        }
        if (shift !== null) {
          bleedL -= shift[0];
          bleedT -= shift[1];
          note = '像素校准 shift=(' + shift[0] + ',' + shift[1] + ')';
        }
        styles = styles.filter((kv) => ['left', 'top', 'width', 'height'].indexOf(kv[0]) < 0);
        styles = [['left', px(f.x - bleedL)], ['top', px(f.y - bleedT)],
                  ['width', px(rw)], ['height', px(rh)]].concat(styles);
        logFix('bleed', "位图回摆 '" + node.name + "': frame " + f.w + 'x' + f.h +
                        ' -> 渲染 ' + num(rw) + 'x' + num(rh) + ' [' + note + ']');
      }
    }
    radiusCss(node, styles, node.type === 'oval');
    const pad = '  '.repeat(indent);
    return pad + '<img class="n img" data-name="' + esc(node.name) + '" ' +
           'src="' + url + '" style="' + styleAttr(styles) + '" alt="">\n';
  }

  function renderText(node, indent) {
    const styles = baseStyles(node);
    let runs = node.runs || [];
    const text = node.text != null ? node.text : '';
    const pad = '  '.repeat(indent);
    if (!runs.length) {
      return pad + '<div class="n txt" style="' + styleAttr(styles) + '">' + esc(text) + '</div>\n';
    }

    // 图层色/祖先 tint 已在 parse 端下发进 runs[].color, 消费端零覆盖逻辑;
    // 文本节点带 fills 只剩渐变文字(罕见), 首色近似
    const gradFill = (node.fills || []).find((fl) => 'gradient' in fl);
    if (gradFill) {
      const approx = gradFill.gradient.stops[0].color;
      runs = runs.map((r) => Object.assign({}, r, { color: approx }));
      logFix('text-gradient-approx', "渐变文字 '" + node.name.slice(0, 20) + "' 用首 stop " + approx + ' 近似');
    }

    const r0 = runs[0];
    // 行高兜底链: run.lineHeight -> effectiveLineHeight(parse 侧已按同一规则算好) -> 本地近似
    let lh = r0.lineHeight || node.effectiveLineHeight;
    if (!lh) {
      // 单行文本的 frame 高度就是 Sketch 实算的默认行高, 直接采用;
      // 多行文本用 PingFang 默认行高 ~1.4x 字号近似
      const fh = node.frame.h;
      lh = fh <= r0.size * 1.9 ? fh : Math.round(r0.size * 1.4);
    }
    const align = node.align || r0.align || 'left';
    styles.push(
      ['font-family', "'" + (r0.fontFamily || 'PingFang SC') + "', 'PingFang SC', -apple-system, sans-serif"],
      ['font-size', px(r0.size)],
      ['font-weight', String(r0.fontWeight != null ? r0.fontWeight : 400)],
      ['color', colorCss(r0.color != null ? r0.color : '#000')],
      ['line-height', px(lh)],
      ['text-align', align]);
    if (r0.letterSpacing) styles.push(['letter-spacing', px(r0.letterSpacing)]);

    const multiline = node.textResizing === 'auto-height' || node.frame.h >= lh * 1.8;
    if (!multiline) {
      styles.push(['white-space', 'nowrap']);
    } else {
      // text 里的显式换行符(\n)必须保留, HTML 默认会折叠成空格
      // (多段落正文与竖排星号列全靠 \n 定位)
      styles.push(['white-space', 'pre-wrap']);
      if (text.indexOf('\n') >= 0) {
        logFix('text-newline', "多行文本 '" + node.name.slice(0, 20) + "' 含 " +
                               (text.match(/\n/g) || []).length + ' 个换行符, pre-wrap 保留');
      }
    }

    let body;
    if (runs.length <= 1) {
      body = esc(text);
    } else {
      // 多 run: 按 from/len 切 span, 只写与首 run 不同的属性
      const parts = [];
      for (const r of runs) {
        const seg = text.slice(r.from, r.from + r.len);
        const sp = [];
        if (r.color !== r0.color) sp.push(['color', colorCss(r.color)]);
        if (r.size !== r0.size) sp.push(['font-size', px(r.size)]);
        if (r.fontWeight !== r0.fontWeight) sp.push(['font-weight', String(r.fontWeight != null ? r.fontWeight : 400)]);
        if (sp.length) parts.push('<span style="' + styleAttr(sp) + '">' + esc(seg) + '</span>');
        else parts.push(esc(seg));
      }
      body = parts.join('');
    }
    return pad + '<div class="n txt" data-name="' + esc(node.name) + '" style="' + styleAttr(styles) + '">' + body + '</div>\n';
  }

  async function renderNode(node, indent) {
    if (indent === undefined) indent = 1;
    const t = node.type;
    if (t === 'slice') return ''; // 切片无视觉(同 frame 切图已在 parse 端上提到父 group)

    // 无填充的纯阴影载体矩形: CSS box-shadow 比位图更准(位图常被画板边缘裁切)
    if ((t === 'rect' || t === 'oval') && node.shadows && node.shadows.length &&
        !(node.fills && node.fills.length) && node.renderHint === 'image') {
      logFix('shadow-rect', "纯阴影矩形 '" + node.name + "' " + JSON.stringify(node.absFrame) + ' 改走 CSS box-shadow');
      return renderShape(node, indent);
    }

    // 栅格化节点 / 位图节点直接用位图(导出位图已带着色效果, 不再处理)
    if (node.image && (node.renderHint === 'image' || t === 'image')) {
      // 退化位图守卫: frame 明显大于 2x2 却导出 1x1 空 PNG(fill 全禁用的不可见图层
      // 也会进切图管道) -> 位图不可用, 退回矢量渲染; 通常无可见样式, 渲染为空即忠实,
      // 不要按 sibling 猜色补线(实测该类图层在原稿里本就不可见)
      const f = node.frame;
      const nat = await pngSize(node.image.url);
      if (nat && nat[0] <= 1 && nat[1] <= 1 && (f.w > 2 || f.h > 2)) {
        logFix('degenerate-bitmap', "'" + node.name + "' " + JSON.stringify(node.absFrame) + ' 导出位图仅 1x1, 退回矢量渲染');
        return renderShape(node, indent);
      }
      return renderImageNode(node, indent);
    }

    if (t === 'text') return renderText(node, indent);
    if (t === 'path' && node.svgPath) return renderPath(node, indent);
    if (t === 'rect' || t === 'oval') return renderShape(node, indent);

    // group: 容器。纯色着色提示(tint)已在 parse 端下发子孙并删除, 消费端无
    // 下发逻辑; shapeGroup=true 是布尔运算形状组, 其 fills 是真实填充需要渲染。
    const styles = baseStyles(node);
    let shapeChildren = node.children || [];
    if (node.shapeGroup) {
      if (node.fills && node.fills.length && shapeChildren.length === 0) {
        // 无子路径的 shapeGroup: bbox 填充是唯一可用信息
        for (const fl of node.fills) {
          for (const kv of fillToBg(fl)) styles.push(kv);
        }
      } else if (node.fills && node.fills.length) {
        // 无位图兜底的 shapeGroup: 把 bbox 涂成 fills 会出现"色块"(logo 文字/圆形
        // 气泡变实心方块)。改为不画 bbox: 子路径合成单个 SVG + fill-rule=evenodd
        // (subtract 挖洞正确: 时钟/放大镜/ⓘ 等镂空 icon); 无法合成的退回逐个填色。
        const svg = shapegroupSvg(node, indent);
        if (svg !== null) {
          logFix('shapegroup-no-image', "shapeGroup '" + node.name + "' " + JSON.stringify(node.absFrame) +
                                        ' 无位图, 子路径合成 SVG evenodd 渲染');
          return svg;
        }
        logFix('shapegroup-no-image', "shapeGroup '" + node.name + "' " + JSON.stringify(node.absFrame) +
                                      ' 无位图, fills 下发子路径逐个填色(union 近似)');
        const gf = node.fills;
        shapeChildren = shapeChildren.map((c) =>
          Object.assign({}, c, { fills: (c.fills && c.fills.length) ? c.fills : gf }));
      }
    }
    bordersToCss(node, styles);
    radiusCss(node, styles);
    if (node.id in Z_FIX) styles.push(['z-index', String(Z_FIX[node.id])]);
    const pad = '  '.repeat(indent);
    let out = pad + '<div class="n grp" data-name="' + esc(node.name) + '" ' +
              'style="' + styleAttr(styles) + '">\n';
    for (const c of shapeChildren) {
      out += await renderNode(c, indent + 1);
    }
    out += pad + '</div>\n';
    return out;
  }

  // ---------------- 组装页面 ----------------

  let bodyNodes = '';
  const artStyles = [['width', px(ART_W)], ['height', px(ART_H)], ['position', 'relative']];
  // 画板背景 fills 必填(parse 端 bake 兜底白底), 消费端零兜底直接读
  for (const fl of ART.fills) {
    for (const kv of fillToBg(fl)) artStyles.push(kv);
  }
  for (const c of ART.children || []) {
    bodyNodes += await renderNode(c, 3);
  }

  const origUrl = (ART.image || {}).url || '';
  const title = ART.name != null ? ART.name : 'restore';
  const fontFaces = await buildFontFaces();

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
    <div class="artboard" id="restore" style="${styleAttr(artStyles)}">
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
      // len 对齐 Python 版的 len(HTML)(字符数口径, 便于双跑对照)
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
