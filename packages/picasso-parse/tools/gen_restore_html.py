#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RestoreDSL(schemaVersion 1.0) -> 静态 HTML 还原稿生成器（确定性渲染基线, v4 削薄版）
用法: python3 render_restore.py <restore.json> <output.html>

定位: 模拟 LLM 消费者的确定性渲染器, 用于区分「数据不够还原」(改 parse/插件)
与「LLM 没用好数据」(改提示词)。渲染语义规范见 schema/restore-dsl-rendering-guide.md。

v4 削薄(消费 schema 1.0 CSS-ready 语义, 对应 parse 端 bake.ts):
  - 渐变: 直接读 gradient.css(angle/stops[].pct 已按节点实际宽高投影算好), 删投影计算
  - tint: 纯色 tint 已在 parse 下发删除, 删递归下发逻辑
  - text.fills: 已在 parse 下发 runs[].color, 删覆盖逻辑
  - rotation/flip: 契约「字段出现 = 必须应用」, 无任何按类型的剥离启发式
  - 画板背景: fills 必填, 删兜底链
  - stroke-only 细直线: parse 已转 fills 矩形, 无需特判
可选依赖: Pillow(仅老 Symbol 素材无 image.frame 时的像素校准回退用), 无网络时自动降级。

字体嵌入: 设计稿常用私有字体(如 58 数字字体 don58)浏览器无内置, 回退 PingFang 后
数字字形明显变宽(实测 19 画板 don58 42px 数值回退后压住"万个"后缀)。设环境变量
PICASSO_FONT_DIR, 脚本按 DSL 实际用到的 fontFamily 匹配来源条目, base64 内联为
@font-face; 找不到时仅 log 提示不阻断。条目两种形态(可混用):
  - 本地目录: 递归找 <family>*.woff2/woff/ttf
  - 字体文件完整 URL(https?://...): HTTP 无法枚举远程目录, 远程只支持点名到文件;
    按 URL 文件名做同样的 family/weight 匹配, 命中后下载内联, 失败仅 log 不阻断
分隔规则: 含 '://' 用英文逗号分隔(URL 自身带冒号), 否则按老口径冒号分隔。
"""
import base64
import json
import math
import os
import re
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
    """线性渐变直接消费 gradient.css(parse 端 bake 已按节点实际宽高投影算好,
    pct 可为负/超 100, 浏览器沿渐变线外推)。无 css 字段(非线性/退化)取首色纯背景。"""
    css = g.get('css')
    if not css:
        return color_css(g['stops'][0]['color'])
    stops = ', '.join(f"{color_css(s['color'])} {num(s['pct'])}%" for s in css['stops'])
    return f"linear-gradient({num(css['angle'])}deg, {stops})"

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
    """[修正] Sketch 语义: flip 在世界坐标系下, rotation 是最终旋转角 → 先 rotate 后 flip。
    CSS transform 矩阵从右到左应用, 所以要写成 'scale(...) rotate(...)' (scale 在左, rotate
    在右) 才能让 rotate 先应用于图形。
    旧写法 'rotate(...) scale(...)' 语义颠倒:
      案例 <"箭头 (01/09/15 左上): 两条 4x24 rect, rot=-45, 其中一条 flip.y。
      Sketch 语义: 竖长条 rotate → "/" → flip.y → "\", 组合得 "<";
      旧 CSS 顺序: flip.y (对称长条无变化) → rotate → "/", 两条都渲成 "/", 变成 "/"。
    """
    parts = []
    rot = node.get('rotation')
    flip = node.get('flip')
    if flip:
        sx = -1 if flip.get('x') else 1
        sy = -1 if flip.get('y') else 1
        if sx != 1 or sy != 1:
            parts.append(f'scale({sx}, {sy})')
    if rot:
        parts.append(f'rotate({num(-rot)}deg)')  # Sketch 逆时针为正 -> CSS 取负
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

# ---------------- 私有字体嵌入 ----------------
# 浏览器无内置的设计稿字体(don58 等)按需内联, 否则回退 PingFang 导致数字字宽失真
_FONT_WEIGHT_HINTS = [('thin', 100), ('extralight', 200), ('light', 300),
                      ('medium', 500), ('semibold', 600), ('bold', 700),
                      ('black', 900), ('regular', 400)]
_FONT_MIME = {'.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf'}


def _used_font_families(node, acc):
    for r in node.get('runs', []):
        if r.get('fontFamily'):
            acc.add(r['fontFamily'])
    for c in node.get('children', []):
        _used_font_families(c, acc)


def _font_match(fam, fn):
    """文件名 -> (weight, ext_priority); 不匹配该 family 返回 None"""
    ext = os.path.splitext(fn)[1].lower()
    if ext not in _FONT_MIME or not fn.lower().startswith(fam.lower()):
        return None
    weight = 400
    for hint, w in _FONT_WEIGHT_HINTS:
        if hint in fn.lower():
            weight = w
            break
    return weight, ['.woff2', '.woff', '.ttf'].index(ext)


def build_font_faces():
    """按 DSL 用到的 fontFamily 找字体文件, 内联 @font-face。来源条目两种形态(可混用):
    本地目录(递归找 <family>*.woff2/woff/ttf) / 字体文件完整 URL(HTTP 无法枚举
    远程目录, 远程只支持点名到文件, 按 URL 文件名做同样匹配, 命中后下载内联)。
    同 family 多 weight 各出一条(文件名含 Medium/Bold 等权重提示词); 同 weight
    多格式时取 woff2 > woff > ttf。"""
    raw = os.environ.get('PICASSO_FONT_DIR', '')
    # URL 自身带冒号, 含 '://' 时改用逗号分隔, 纯本地目录保持冒号老口径
    entries = [d for d in raw.split(',' if '://' in raw else ':') if d.strip()]
    if not entries:
        return ''
    fams = set()
    _used_font_families(ART, fams)
    # 系统字体无需嵌入: .SFNS(苹果系统字面名)与 PingFang 系 macOS/iOS 自带
    fams = {f for f in fams if not f.startswith('.') and 'pingfang' not in f.lower()}
    faces = []
    for fam in sorted(fams):
        found = {}  # weight -> (ext_priority, ('file', path, name) | ('url', url, name))
        for entry in entries:
            e = entry.strip()
            if re.match(r'https?://', e, re.I):
                try:
                    from urllib.parse import urlparse, unquote
                    fn = unquote(urlparse(e).path.rsplit('/', 1)[-1])
                except Exception:
                    continue
                m = _font_match(fam, fn)
                if not m:
                    continue
                weight, prio = m
                if weight not in found or prio < found[weight][0]:
                    found[weight] = (prio, ('url', e, fn))
            else:
                for dirpath, _dirnames, filenames in os.walk(entry):
                    for fn in filenames:
                        m = _font_match(fam, fn)
                        if not m:
                            continue
                        weight, prio = m
                        if weight not in found or prio < found[weight][0]:
                            found[weight] = (prio, ('file', os.path.join(dirpath, fn), fn))
        for weight, (_prio, src) in sorted(found.items()):
            kind, loc, name = src
            if kind == 'url':
                try:
                    import urllib.request
                    data = urllib.request.urlopen(loc, timeout=15).read()
                except Exception:
                    log_fix('font-missing', f'字体文件下载失败 {loc}, 跳过')
                    continue
            else:
                with open(loc, 'rb') as fp:
                    data = fp.read()
            b64 = base64.b64encode(data).decode('ascii')
            ext = os.path.splitext(name)[1].lower()
            fmt = {'.woff2': 'woff2', '.woff': 'woff', '.ttf': 'truetype'}[ext]
            faces.append(
                f"  @font-face {{ font-family: '{fam}'; font-weight: {weight}; "
                f"src: url(data:{_FONT_MIME[ext]};base64,{b64}) format('{fmt}'); }}")
            log_fix('font-embed', f"内联字体 {fam} weight={weight} <- {name}")
        if not found:
            log_fix('font-missing', f"字体 {fam!r} 在 PICASSO_FONT_DIR 未找到, 将回退 PingFang(字宽可能失真)")
    return '\n'.join(faces)


# ---------------- 位图尺寸感知 ----------------
# 切图统一导出倍率从 meta.assetsScale 读; 老数据缺省按 750 宽画板 @2x 惯例
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
    - 有 image.frame: 插件端采集的画布真实范围(画板绝对坐标), 直接换算摆位
    - 老数据回退: 有 shadows 按 blur/offset 公式外扩, 否则居中假设 + 像素校准
    """
    f = node['frame']
    af = node.get('absFrame', f)
    styles = base_styles(node)
    # 位图 transform 契约(beta.6 定稿): 切图是 Sketch 渲染管线产物, 图层自身变换
    # 必烘焙进像素, parse 端 bake 对带 url 节点(含 group/shapeGroup)已删 rotation/
    # flip; 产物里字段出现即必须应用, 渲染端零启发式。勘误: 曾据"01 气泡需 CSS 再
    # 翻转"判定 group 位图未烘焙, 同一 URL 数据复核证实为误判(切图与原图尖角方向
    # 本就一致, 再翻反而双重翻转)。前提: 插件收口在 URL 回填后重跑 bakeRestoreTree。
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
                # 物理约束截断: 单侧 bleed 不可能超过 PNG 与 frame 的总差值,
                # 也不可能越过画板边缘(导出画布被画板裁切)。实测: 贴画板顶的全宽页头
                # 阴影朝下, 公式假设 bleed(10,8) 而真实 (0,0), 不截断会整条偏移。
                raw_l, raw_t = bleed_l, bleed_t
                bleed_l = max(0.0, min(bleed_l, rw - f['w'], af['x']))
                bleed_t = max(0.0, min(bleed_t, rh - f['h'], af['y']))
                if (raw_l, raw_t) != (bleed_l, bleed_t):
                    log_fix('bleed-clamp', f"{node['name']!r} 阴影公式 bleed({num(raw_l)},{num(raw_t)}) "
                                           f"按物理约束截断为 ({num(bleed_l)},{num(bleed_t)})")
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

    # 图层色/祖先 tint 已在 parse 端下发进 runs[].color, 消费端零覆盖逻辑;
    # 文本节点带 fills 只剩渐变文字(罕见), 首色近似
    grad_fill = next((fl for fl in node.get('fills', []) if 'gradient' in fl), None)
    if grad_fill:
        approx = grad_fill['gradient']['stops'][0]['color']
        runs = [dict(r, color=approx) for r in runs]
        log_fix('text-gradient-approx', f"渐变文字 {node['name'][:20]!r} 用首 stop {approx} 近似")

    r0 = runs[0]
    # 行高兜底链: run.lineHeight -> effectiveLineHeight(parse 侧已按同一规则算好) -> 本地近似
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
    else:
        # text 里的显式换行符(\n)必须保留, HTML 默认会折叠成空格
        # (多段落正文与竖排星号列全靠 \n 定位)
        styles.append(('white-space', 'pre-wrap'))
        if '\n' in text:
            log_fix('text-newline', f"多行文本 {node['name'][:20]!r} 含 {text.count(chr(10))} 个换行符, pre-wrap 保留")

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
    # 描边骑线(center)会向 frame 外溢出半个 thickness, svg 默认 overflow:hidden 会裁掉
    # (案例: 4px stroke 画在 1px 高 viewBox 里只剩 1px)——描边路径放开裁剪
    if stroke:
        styles.append(('overflow', 'visible'))
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

def _translate_d(d, tx, ty):
    """平移 svgPath(实测产物只含绝对 M/L/C/Z, 所有数字均为坐标对)"""
    if not tx and not ty:
        return d
    idx = [0]
    def rep(m):
        v = float(m.group(0)) + (tx if idx[0] % 2 == 0 else ty)
        idx[0] += 1
        return num(round(v, 4))
    return re.sub(r'-?\d+\.?\d*(?:e-?\d+)?', rep, d)

def _child_path_d(c):
    """shapeGroup 子节点 -> 组本地坐标系的 path d; 不支持的返回 None"""
    f = c['frame']
    if c.get('rotation') or c.get('flip'):
        return None
    if c['type'] == 'path' and c.get('svgPath'):
        # svgPath 是子节点本地坐标, 平移到组坐标系后拼进同一个 <path>
        return _translate_d(c['svgPath'], f['x'], f['y'])
    if c['type'] == 'oval':
        k = 0.5523
        rx, ry = f['w'] / 2, f['h'] / 2
        cx, cy = f['x'] + rx, f['y'] + ry
        n = lambda v: num(round(v, 3))
        return (f"M{n(cx - rx)} {n(cy)} "
                f"C{n(cx - rx)} {n(cy - k * ry)} {n(cx - k * rx)} {n(cy - ry)} {n(cx)} {n(cy - ry)} "
                f"C{n(cx + k * rx)} {n(cy - ry)} {n(cx + rx)} {n(cy - k * ry)} {n(cx + rx)} {n(cy)} "
                f"C{n(cx + rx)} {n(cy + k * ry)} {n(cx + k * rx)} {n(cy + ry)} {n(cx)} {n(cy + ry)} "
                f"C{n(cx - k * rx)} {n(cy + ry)} {n(cx - rx)} {n(cy + k * ry)} {n(cx - rx)} {n(cy)} Z")
    if c['type'] == 'rect' and not c.get('borderRadius'):
        return (f"M{num(f['x'])} {num(f['y'])} L{num(f['x'] + f['w'])} {num(f['y'])} "
                f"L{num(f['x'] + f['w'])} {num(f['y'] + f['h'])} L{num(f['x'])} {num(f['y'] + f['h'])} Z")
    return None

def shapegroup_svg(node, indent):
    """无位图 shapeGroup: 子路径拼进一个 SVG, fill-rule=evenodd 近似布尔运算
    (subtract 的内路径成为挖洞)。返回 None 表示无法合成, 由调用方走逐子路径填色回退。"""
    kids = node.get('children', [])
    if not kids:
        return None
    fill = next((fl['color'] for fl in node.get('fills', []) if 'color' in fl), None)
    if not fill:
        return None
    parts = []
    for c in kids:
        p = _child_path_d(c)
        if p is None:
            return None
        parts.append(p)
    f = node['frame']
    styles = base_styles(node)
    stroke = ''
    for b in node.get('borders', []):
        stroke = f' stroke="{color_css(b["color"])}" stroke-width="{num(b["thickness"])}"'
        break
    # 全部子路径拼进同一个 <path>: fill-rule=evenodd 只在单个 path 元素内生效,
    # 跨元素不会挖洞(时钟/放大镜/ⓘ 等 subtract icon 会被填成实心)
    combined = ' '.join(parts)
    pad = '  ' * indent
    return (f'{pad}<svg class="n" data-name="{esc(node["name"])}" style="{style_attr(styles)}" '
            f'viewBox="0 0 {num(f["w"])} {num(f["h"])}" preserveAspectRatio="none">'
            f'<path d="{combined}" fill="{color_css(fill)}" fill-rule="evenodd"{stroke}/></svg>\n')

# 需要提到顶层 z-index 的节点(在原 JSON 里层级偏低会被后续白底盖住)
Z_FIX = {}

def render_node(node, indent=1):
    t = node['type']
    if t == 'slice':
        return ''  # 切片无视觉(同 frame 切图已在 parse 端上提到父 group)

    # 无填充的纯阴影载体矩形: CSS box-shadow 比位图更准(位图常被画板边缘裁切)
    if (t in ('rect', 'oval') and node.get('shadows')
            and not node.get('fills') and node.get('renderHint') == 'image'):
        log_fix('shadow-rect', f"纯阴影矩形 {node['name']!r} {node['absFrame']} 改走 CSS box-shadow")
        return render_shape(node, indent)

    # 栅格化节点 / 位图节点直接用位图(导出位图已带着色效果, 不再处理)
    if node.get('image') and (node.get('renderHint') == 'image' or t == 'image'):
        # 退化位图守卫: frame 明显大于 2x2 却导出 1x1 空 PNG(fill 全禁用的不可见图层
        # 也会进切图管道) -> 位图不可用, 退回矢量渲染; 通常无可见样式, 渲染为空即忠实,
        # 不要按 sibling 猜色补线(实测该类图层在原稿里本就不可见)
        f = node['frame']
        nat = png_size(node['image']['url'])
        if nat and nat[0] <= 1 and nat[1] <= 1 and (f['w'] > 2 or f['h'] > 2):
            log_fix('degenerate-bitmap', f"{node['name']!r} {node['absFrame']} 导出位图仅 1x1, 退回矢量渲染")
            return render_shape(node, indent)
        return render_image_node(node, indent)

    if t == 'text':
        return render_text(node, indent)
    if t == 'path' and node.get('svgPath'):
        return render_path(node, indent)
    if t in ('rect', 'oval'):
        return render_shape(node, indent)

    # group: 容器。纯色着色提示(tint)已在 parse 端下发子孙并删除, 消费端无
    # 下发逻辑; shapeGroup=true 是布尔运算形状组, 其 fills 是真实填充需要渲染。
    styles = base_styles(node)
    shape_children = node.get('children', [])
    if node.get('shapeGroup'):
        if node.get('fills') and len(shape_children) == 0:
            # 无子路径的 shapeGroup: bbox 填充是唯一可用信息
            for fl in node.get('fills', []):
                styles += fill_to_bg(fl)
        elif node.get('fills'):
            # 无位图兜底的 shapeGroup: 把 bbox 涂成 fills 会出现"色块"(logo 文字/圆形
            # 气泡变实心方块)。改为不画 bbox: 子路径合成单个 SVG + fill-rule=evenodd
            # (subtract 挖洞正确: 时钟/放大镜/ⓘ 等镂空 icon); 无法合成的退回逐个填色。
            svg = shapegroup_svg(node, indent)
            if svg is not None:
                log_fix('shapegroup-no-image', f"shapeGroup {node['name']!r} {node['absFrame']} 无位图, "
                                               f"子路径合成 SVG evenodd 渲染")
                return svg
            log_fix('shapegroup-no-image', f"shapeGroup {node['name']!r} {node['absFrame']} 无位图, "
                                           f"fills 下发子路径逐个填色(union 近似)")
            gf = node['fills']
            shape_children = [dict(c, fills=c.get('fills') or gf) for c in shape_children]
    borders_to_css(node, styles)
    radius_css(node, styles)
    if node['id'] in Z_FIX:
        styles.append(('z-index', str(Z_FIX[node['id']])))
    pad = '  ' * indent
    out = (f'{pad}<div class="n grp" data-name="{esc(node["name"])}" '
           f'style="{style_attr(styles)}">\n')
    for c in shape_children:
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
# 画板背景 fills 必填(parse 端 bake 兜底白底), 消费端零兜底直接读
for fl in ART['fills']:
    art_styles += fill_to_bg(fl)
for c in ART.get('children', []):
    body_nodes += render_node(c, 3)

orig_url = (ART.get('image') or {}).get('url', '')
title = ART.get('name', 'restore')
font_faces = build_font_faces()

HTML = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>{esc(title)} · RestoreDSL 还原稿</title>
<style>
{font_faces}
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
  <span style="opacity:.5">{num(ART_W)} × {num(ART_H)} · schemaVersion {esc(str(DSL.get('schemaVersion')))} · parser {esc(DSL['meta'].get('parserVersion',''))}</span>
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
