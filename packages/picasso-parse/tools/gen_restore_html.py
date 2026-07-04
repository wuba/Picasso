#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RestoreDSL(schemaVersion 1.x) -> 静态 HTML 还原稿生成器（确定性渲染基线）
用法: python3 gen_restore_html.py <restore.json> <output.html>

定位: 模拟 LLM 消费者的确定性渲染器, 用于区分「数据不够还原」(改 parse/插件)
与「LLM 没用好数据」(改提示词)。渲染语义规范见 ../schema/restore-dsl-rendering-guide.md,
本脚本实现与该文档保持一致。
schema 1.2 消费: image.frame 优先摆位(免像素校准)、image.scale/meta.assetsScale、
effectiveLineHeight 行高兜底、tint 不渲染 / shapeGroup 真填充。
可选依赖: Pillow(仅老数据无 image.frame 时的像素校准回退用), 无网络时自动降级。
"""
import json
import math
import sys
import html as html_mod

SRC = sys.argv[1]
OUT = sys.argv[2]

with open(SRC) as f:
    DSL = json.load(f)

ART = DSL['artboard']
ART_W = ART['frame']['w']
ART_H = ART['frame']['h']

# ---------------- 修正记录 ----------------
FIXES = []  # 生成期间自动记录的修正项 (由人工整理进文档)

def log_fix(tag, msg):
    FIXES.append((tag, msg))

# ---------------- 工具函数 ----------------

def esc(s):
    return html_mod.escape(s, quote=False)

def num(v):
    """去掉多余小数位"""
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    if isinstance(v, float):
        return f'{v:g}'
    return str(v)

def px(v):
    return f'{num(v)}px'

def color_css(hexs):
    """#RRGGBB / #RRGGBBAA 直接输出，现代浏览器原生支持 8 位 hex"""
    return hexs

def gradient_css(g):
    """Sketch 线性渐变 from/to(单位坐标, y 向下) -> CSS linear-gradient 角度"""
    fx, fy = g['from']
    tx, ty = g['to']
    dx, dy = tx - fx, ty - fy
    # CSS: 0deg = to top, 顺时针; 向量 y 轴向下, 故取 atan2(dx, -dy)
    ang = math.degrees(math.atan2(dx, -dy))
    stops = ', '.join(f"{color_css(s['color'])} {num(s['position']*100)}%" for s in g['stops'])
    return f'linear-gradient({num(round(ang, 2))}deg, {stops})'

def fill_to_bg(fill):
    """单个 fill -> (background-color / background-image) css 片段列表"""
    if 'color' in fill:
        return [('background-color', color_css(fill['color']))]
    if 'gradient' in fill:
        g = fill['gradient']
        if g.get('type') == 'linear':
            return [('background-image', gradient_css(g))]
        # 非线性渐变兜底: 取第一个 stop 颜色
        return [('background-color', color_css(g['stops'][0]['color']))]
    if 'image' in fill:
        return [('background-image', f"url('{fill['image']['url']}')"),
                ('background-size', 'cover'),
                ('background-position', 'center')]
    return []

def borders_to_css(node, styles):
    """borders/shadows -> box-shadow 模拟(不影响布局)。
    边框: inside=inset, outside=spread, center=对半; 投影: 直接映射 drop shadow"""
    shadows = []
    for s in node.get('shadows', []):
        shadows.append(f"{px(s.get('x', 0))} {px(s.get('y', 0))} {px(s.get('blur', 0))} "
                       f"{px(s.get('spread', 0))} {color_css(s['color'])}")
    for b in node.get('borders', []):
        c = color_css(b['color'])
        t = b['thickness']
        pos = b.get('position', 'center')
        if pos == 'inside':
            shadows.append(f'inset 0 0 0 {px(t)} {c}')
        elif pos == 'outside':
            shadows.append(f'0 0 0 {px(t)} {c}')
        else:  # center: 内外各一半
            shadows.append(f'inset 0 0 0 {px(t/2)} {c}')
            shadows.append(f'0 0 0 {px(t/2)} {c}')
    if shadows:
        styles.append(('box-shadow', ', '.join(shadows)))

def radius_css(node, styles, is_oval=False):
    if is_oval:
        styles.append(('border-radius', '50%'))
        return
    br = node.get('borderRadius')
    if br:
        if len(set(br)) == 1:
            styles.append(('border-radius', px(br[0])))
        else:
            styles.append(('border-radius', ' '.join(px(v) for v in br)))

def transform_css(node, styles):
    parts = []
    rot = node.get('rotation')
    if rot:
        parts.append(f'rotate({num(-rot)}deg)')  # Sketch 逆时针为正 -> CSS 取负
    flip = node.get('flip')
    if flip:
        sx = -1 if flip.get('x') else 1
        sy = -1 if flip.get('y') else 1
        if sx != 1 or sy != 1:
            parts.append(f'scale({sx}, {sy})')
    if parts:
        styles.append(('transform', ' '.join(parts)))
        styles.append(('transform-origin', 'center'))

def base_styles(node):
    f = node['frame']
    styles = [
        ('left', px(f['x'])),
        ('top', px(f['y'])),
        ('width', px(f['w'])),
        ('height', px(f['h'])),
    ]
    if node.get('opacity') is not None:
        styles.append(('opacity', num(node['opacity'])))
    transform_css(node, styles)
    return styles

def style_attr(styles):
    return '; '.join(f'{k}: {v}' for k, v in styles)

# ---------------- 位图尺寸感知 ----------------
# [1.2] 切图统一导出倍率从 meta.assetsScale 读; 老数据缺省按 750 宽画板 @2x 惯例
ASSETS_SCALE = DSL.get('meta', {}).get('assetsScale') or 2

def image_scale(node):
    """节点级 image.scale 优先(与全局不同时才落盘), 否则用 meta.assetsScale"""
    return (node.get('image') or {}).get('scale') or ASSETS_SCALE

_png_size_cache = {}

def png_size(url):
    """只下载 PNG 头部读 IHDR 宽高; 失败返回 None"""
    if url in _png_size_cache:
        return _png_size_cache[url]
    size = None
    try:
        import urllib.request
        req = urllib.request.Request(url, headers={'Range': 'bytes=0-40'})
        head = urllib.request.urlopen(req, timeout=10).read(41)
        if head[:8] == b'\x89PNG\r\n\x1a\n' and head[12:16] == b'IHDR':
            w = int.from_bytes(head[16:20], 'big')
            h = int.from_bytes(head[20:24], 'big')
            size = (w, h)
    except Exception:
        pass
    _png_size_cache[url] = size
    return size

# ---------------- 像素校准 ----------------
# bleed 回摆的方向假设(居中/阴影公式)不总成立: 例如头像组的在线状态点让 bleed 全在右下。
# 校准: 与画板原始截图做小范围位移搜索, 用实测位移落位。依赖 Pillow + 网络, 失败自动回退假设值。
_art_img = ['UNINIT']
_bitmap_cache = {}

def _artboard_pixels():
    if _art_img[0] != 'UNINIT':
        return _art_img[0]
    img = None
    try:
        from PIL import Image
        import urllib.request, io
        url = (ART.get('image') or {}).get('url')
        if url:
            img = Image.open(io.BytesIO(urllib.request.urlopen(url, timeout=15).read())).convert('RGB')
            if img.size != (round(ART_W), round(ART_H)):
                img = img.resize((round(ART_W), round(ART_H)))
    except Exception:
        img = None
    _art_img[0] = img
    return img

def calibrate_placement(url, gx, gy, rw, rh, dx_range, dy_range):
    """在物理可行域内搜索位图与原图的最佳对齐位移; 返回 (dx,dy) 或 None。
    可行域约束: 导出位图范围必然包含图层 frame, 位移不能超过 bleed 量本身,
    否则会把低对比区域的噪声拟合成大偏移。"""
    art = _artboard_pixels()
    if art is None:
        return None
    try:
        from PIL import Image
        import urllib.request, io
        if url not in _bitmap_cache:
            _bitmap_cache[url] = Image.open(io.BytesIO(
                urllib.request.urlopen(url, timeout=15).read())).convert('RGB')
        sp = _bitmap_cache[url].resize((max(1, round(rw)), max(1, round(rh))))
        a = sp.tobytes()
        step = max(1, (len(a) // 3 // 4000)) * 3 + 1  # 大图降采样, 控制每次比较 ~4k 像素内
        best = None
        for dy in range(dy_range[0], dy_range[1] + 1):
            for dx in range(dx_range[0], dx_range[1] + 1):
                x0, y0 = round(gx) + dx, round(gy) + dy
                if x0 < 0 or y0 < 0 or x0 + sp.width > art.width or y0 + sp.height > art.height:
                    continue
                b = art.crop((x0, y0, x0 + sp.width, y0 + sp.height)).tobytes()
                d = sum((a[i] - b[i]) ** 2 for i in range(0, len(a), step))
                if best is None or d < best[0]:
                    best = (d, dx, dy)
        return (best[1], best[2]) if best else None
    except Exception:
        return None

# ---------------- 各类型渲染 ----------------

def render_image_node(node, indent):
    """renderHint=image / type=image 的栅格化节点: 直接用位图, 跳过矢量子树。
    位图可能带 bleed(阴影/模糊溢出图层 frame), 按真实渲染尺寸回摆:
    - [1.2] 有 image.frame: 插件端采集的画布真实范围(画板绝对坐标), 直接换算摆位
    - 老数据回退: 有 shadows 按 blur/offset 公式外扩, 否则居中假设 + 像素校准
    """
    f = node['frame']
    af = node.get('absFrame', f)
    styles = base_styles(node)
    url = node['image']['url']

    imf = node['image'].get('frame')
    if imf:
        # image.frame 是画板绝对坐标, 减去父级偏移(absFrame - frame)得父相对坐标
        off_x, off_y = af['x'] - f['x'], af['y'] - f['y']
        styles = [(k, v) for k, v in styles if k not in ('left', 'top', 'width', 'height')]
        styles = [('left', px(imf['x'] - off_x)), ('top', px(imf['y'] - off_y)),
                  ('width', px(imf['w'])), ('height', px(imf['h']))] + styles
        if abs(imf['w'] - f['w']) > 0.25 or abs(imf['h'] - f['h']) > 0.25:
            log_fix('bleed', f"位图回摆 {node['name']!r}: frame {f['w']}x{f['h']} -> "
                             f"渲染 {num(imf['w'])}x{num(imf['h'])} [image.frame]")
        # 交叉验证: PNG 实际尺寸应与 image.frame 一致(允许像素对齐误差)
        nat = png_size(url)
        if nat:
            sc = image_scale(node)
            rw, rh = nat[0] / sc, nat[1] / sc
            if abs(rw - imf['w']) > 0.6 or abs(rh - imf['h']) > 0.6:
                log_fix('bleed-verify', f"警告 {node['name']!r}: image.frame "
                                        f"{num(imf['w'])}x{num(imf['h'])} 与 PNG 实际 {num(rw)}x{num(rh)} 不符")
        radius_css(node, styles, is_oval=(node['type'] == 'oval'))
        pad = '  ' * indent
        return (f'{pad}<img class="n img" data-name="{esc(node["name"])}" '
                f'src="{url}" style="{style_attr(styles)}" alt="">\n')

    nat = png_size(url)
    if nat:
        sc = image_scale(node)
        rw, rh = nat[0] / sc, nat[1] / sc
        if abs(rw - f['w']) > 0.25 or abs(rh - f['h']) > 0.25:
            # 位图含 bleed, 重算摆放位置: 先按 阴影公式/居中 假设, 再与原图做像素校准
            if node.get('shadows'):
                s = node['shadows'][0]
                bleed_l = s['blur'] - s.get('x', 0) + s.get('spread', 0)
                bleed_t = s['blur'] - s.get('y', 0) + s.get('spread', 0)
            else:
                bleed_l = (rw - f['w']) / 2
                bleed_t = (rh - f['h']) / 2
            note = '假设'
            # 可行域: 0 <= bleed_l - dx <= rw - w (位图必须完整覆盖 frame), 上限 ±8 防超大 bleed 全域搜索
            bw, bh = rw - f['w'], rh - f['h']
            dxr = (max(-8, int(math.ceil(bleed_l - bw))), min(8, int(math.floor(bleed_l))))
            dyr = (max(-8, int(math.ceil(bleed_t - bh))), min(8, int(math.floor(bleed_t))))
            shift = None
            if dxr[1] > dxr[0] or dyr[1] > dyr[0]:  # 有可挪空间才搜索
                shift = calibrate_placement(url, af['x'] - bleed_l, af['y'] - bleed_t, rw, rh, dxr, dyr)
            if shift is not None:
                bleed_l -= shift[0]
                bleed_t -= shift[1]
                note = f'像素校准 shift=({shift[0]},{shift[1]})'
            styles = [(k, v) for k, v in styles if k not in ('left', 'top', 'width', 'height')]
            styles = [('left', px(f['x'] - bleed_l)), ('top', px(f['y'] - bleed_t)),
                      ('width', px(rw)), ('height', px(rh))] + styles
            log_fix('bleed', f"位图回摆 {node['name']!r}: frame {f['w']}x{f['h']} -> 渲染 {num(rw)}x{num(rh)} [{note}]")
    radius_css(node, styles, is_oval=(node['type'] == 'oval'))
    pad = '  ' * indent
    return (f'{pad}<img class="n img" data-name="{esc(node["name"])}" '
            f'src="{url}" style="{style_attr(styles)}" alt="">\n')

def render_text(node, indent):
    styles = base_styles(node)
    runs = node.get('runs', [])
    text = node.get('text', '')
    pad = '  ' * indent
    if not runs:
        return f'{pad}<div class="n txt" style="{style_attr(styles)}">{esc(text)}</div>\n'

    r0 = runs[0]
    # 行高兜底链: run.lineHeight -> [1.2] effectiveLineHeight(parse 侧已按同一规则算好) -> 本地近似
    lh = r0.get('lineHeight') or node.get('effectiveLineHeight')
    if not lh:
        # 单行文本的 frame 高度就是 Sketch 实算的默认行高, 直接采用;
        # 多行文本用 PingFang 默认行高 ~1.4x 字号近似
        fh = node['frame']['h']
        lh = fh if fh <= r0['size'] * 1.9 else round(r0['size'] * 1.4)
    align = node.get('align') or r0.get('align') or 'left'
    styles += [
        ('font-family', f"'{r0.get('fontFamily', 'PingFang SC')}', 'PingFang SC', -apple-system, sans-serif"),
        ('font-size', px(r0['size'])),
        ('font-weight', str(r0.get('fontWeight', 400))),
        ('color', color_css(r0.get('color', '#000'))),
        ('line-height', px(lh)),
        ('text-align', align),
    ]
    if r0.get('letterSpacing'):
        styles.append(('letter-spacing', px(r0['letterSpacing'])))

    multiline = node.get('textResizing') == 'auto-height' or node['frame']['h'] >= lh * 1.8
    if not multiline:
        styles.append(('white-space', 'nowrap'))

    if len(runs) <= 1:
        body = esc(text)
    else:
        # 多 run: 按 from/len 切 span, 只写与首 run 不同的属性
        parts = []
        for r in runs:
            seg = text[r['from']: r['from'] + r['len']]
            sp = []
            if r.get('color') != r0.get('color'):
                sp.append(('color', color_css(r['color'])))
            if r.get('size') != r0.get('size'):
                sp.append(('font-size', px(r['size'])))
            if r.get('fontWeight') != r0.get('fontWeight'):
                sp.append(('font-weight', str(r.get('fontWeight', 400))))
            if sp:
                parts.append(f'<span style="{style_attr(sp)}">{esc(seg)}</span>')
            else:
                parts.append(esc(seg))
        body = ''.join(parts)
    return f'{pad}<div class="n txt" data-name="{esc(node["name"])}" style="{style_attr(styles)}">{body}</div>\n'

def render_path(node, indent):
    f = node['frame']
    styles = base_styles(node)
    fill = 'none'
    for fl in node.get('fills', []):
        if 'color' in fl:
            fill = color_css(fl['color'])
            break
    stroke = ''
    for b in node.get('borders', []):
        stroke = f' stroke="{color_css(b["color"])}" stroke-width="{num(b["thickness"])}"'
        break
    rule = ' fill-rule="evenodd"' if node.get('windingRule') == 'evenodd' else ''
    pad = '  ' * indent
    return (f'{pad}<svg class="n" data-name="{esc(node["name"])}" style="{style_attr(styles)}" '
            f'viewBox="0 0 {num(f["w"])} {num(f["h"])}" preserveAspectRatio="none">'
            f'<path d="{node["svgPath"]}" fill="{fill}"{rule}{stroke}/></svg>\n')

def render_shape(node, indent, extra_class=''):
    """rect / oval / 有 fills 的 group 背景"""
    styles = base_styles(node)
    for fl in node.get('fills', []):
        styles += fill_to_bg(fl)
    borders_to_css(node, styles)
    radius_css(node, styles, is_oval=(node['type'] == 'oval'))
    pad = '  ' * indent
    return (f'{pad}<div class="n {extra_class}" data-name="{esc(node["name"])}" '
            f'style="{style_attr(styles)}"></div>\n')

# 需要提到顶层 z-index 的节点(在原 JSON 里层级偏低会被后续白底盖住)
Z_FIX = {}

def render_node(node, indent=1):
    t = node['type']
    if t == 'slice':
        return ''  # 切片无视觉

    # 无填充的纯阴影载体矩形: CSS box-shadow 比位图更准(位图常被画板边缘裁切)
    if (t in ('rect', 'oval') and node.get('shadows')
            and not node.get('fills') and node.get('renderHint') == 'image'):
        log_fix('shadow-rect', f"纯阴影矩形 {node['name']!r} {node['absFrame']} 改走 CSS box-shadow")
        return render_shape(node, indent)

    # 栅格化节点 / 位图节点直接用位图
    if node.get('image') and (node.get('renderHint') == 'image' or t == 'image'):
        return render_image_node(node, indent)

    if t == 'text':
        return render_text(node, indent)
    if t == 'path' and node.get('svgPath'):
        return render_path(node, indent)
    if t in ('rect', 'oval'):
        return render_shape(node, indent)

    # group: 容器。[1.2] 普通编组的着色提示落 tint 字段(不渲染为背景, 渲染会出现
    # "色块"); shapeGroup=true 是布尔运算形状组, 其 fills 才是真实填充需要渲染。
    # (1.1 老数据普通 group 的着色提示仍在 fills 里, 同样不渲染)
    styles = base_styles(node)
    if node.get('shapeGroup'):
        for fl in node.get('fills', []):
            styles += fill_to_bg(fl)
    borders_to_css(node, styles)
    radius_css(node, styles)
    if node['id'] in Z_FIX:
        styles.append(('z-index', str(Z_FIX[node['id']])))
    pad = '  ' * indent
    out = (f'{pad}<div class="n grp" data-name="{esc(node["name"])}" '
           f'style="{style_attr(styles)}">\n')
    for c in node.get('children', []):
        out += render_node(c, indent + 1)
    out += f'{pad}</div>\n'
    return out

# ---------------- 手工修正 ----------------
# (曾尝试把「消息提醒」徽标 z-index 提升到底 bar 之上, 但与原设计图截图比对后
#  确认 Sketch 原始渲染中徽标就是被底 bar 白底盖住的, 忠实还原应保持 DSL 图层顺序,
#  故撤销该改动。详见还原修正记录文档。)

# ---------------- 组装页面 ----------------
body_nodes = ''
art_styles = [('width', px(ART_W)), ('height', px(ART_H)), ('position', 'relative')]
for fl in ART.get('fills', []):
    art_styles += fill_to_bg(fl)
for c in ART.get('children', []):
    body_nodes += render_node(c, 3)

orig_url = (ART.get('image') or {}).get('url', '')
title = ART.get('name', 'restore')

HTML = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>{esc(title)} · RestoreDSL 还原稿</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  html, body {{ background: #2b2d31; font-family: 'PingFang SC', -apple-system, sans-serif; }}
  .toolbar {{
    position: sticky; top: 0; z-index: 100; display: flex; gap: 16px; align-items: center;
    padding: 10px 20px; background: #1e1f22; color: #ddd; font-size: 13px;
    border-bottom: 1px solid #000;
  }}
  .toolbar label {{ display: flex; gap: 6px; align-items: center; cursor: pointer; }}
  .toolbar select, .toolbar input[type=range] {{ cursor: pointer; }}
  .stage {{ display: flex; justify-content: center; padding: 24px; }}
  .wrap {{ position: relative; transform-origin: top center; flex: none; box-shadow: 0 4px 24px rgba(0,0,0,.5); }}
  .artboard {{ overflow: hidden; }}
  .n {{ position: absolute; }}
  .txt {{ pointer-events: none; }}
  .img {{ object-fit: contain; }}
  #origImg {{
    position: absolute; left: 0; top: 0; width: {num(ART_W)}px; height: {num(ART_H)}px;
    pointer-events: none; display: none;
  }}
  body.mode-orig #restore {{ visibility: hidden; }}
  body.mode-orig #origImg {{ display: block; }}
  body.mode-overlay #origImg {{ display: block; }}
</style>
</head>
<body class="mode-restore">
<div class="toolbar">
  <strong>{esc(title)}</strong>
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
  <span style="opacity:.5">750 × {num(ART_H)} · schemaVersion {esc(str(DSL.get('schemaVersion')))} · parser {esc(DSL['meta'].get('parserVersion',''))}</span>
</div>
<div class="stage">
  <div class="wrap" id="wrap" style="width:{num(ART_W)}px; height:{num(ART_H)}px">
    <div class="artboard" id="restore" style="{style_attr(art_styles)}">
{body_nodes}    </div>
    <img id="origImg" src="{orig_url}" alt="原设计图">
  </div>
</div>
<script>
  const modeSel = document.getElementById('mode');
  const zoomSel = document.getElementById('zoom');
  const op = document.getElementById('op');
  const opWrap = document.getElementById('opWrap');
  const wrap = document.getElementById('wrap');
  const origImg = document.getElementById('origImg');
  function apply() {{
    document.body.className = 'mode-' + modeSel.value;
    opWrap.style.display = modeSel.value === 'overlay' ? 'flex' : 'none';
    origImg.style.opacity = modeSel.value === 'overlay' ? op.value / 100 : 1;
    const z = parseFloat(zoomSel.value);
    wrap.style.transform = 'scale(' + z + ')';
    wrap.style.marginBottom = ((z - 1) * {num(ART_H)}) + 'px';
  }}
  modeSel.onchange = zoomSel.onchange = op.oninput = apply;
  apply();
</script>
</body>
</html>
'''

with open(OUT, 'w') as f:
    f.write(HTML)

print(f'written: {OUT} ({len(HTML)} bytes)')
for tag, msg in FIXES:
    print(f'[fix:{tag}] {msg}')
