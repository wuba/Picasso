/**
 * RestoreDSL 树的 CSS-ready 后处理（bake）。
 *
 * 方针：DSL 输出「最终值」语义——凡是需要消费端做"如果 X 缺就用 Y 兜底"或"把 X 换算成 B"
 * 的字段，都在这里算成消费端可直接映射的形态。语义收敛在 parse 单点，多消费端
 * （确定性渲染器 / LLM / 其他语言实现）不再各自推断，实现不漂移。
 *
 * 挂载点：mapNode 之后、linkTokens 之前（见 parseRestoreDSL/index.ts）。
 * 选择在 RestoreNode 树上后处理而非改 normalize.ts 的原因：normalize 与 contentSignature
 * 同源，动它会让全量 contentHash 漂移（历史版本 diff 降级）；bake 只改产物形态不碰指纹。
 *
 * 处理项（对应还原修正记录的下沉清单）：
 *  1. 画板背景必填：根 artboard 无 fills 时显式写白底（消费端删兜底链）
 *  2. tint 下发：纯色 tint 应用到子孙 fills/borders/runs 的 color 后删除 tint 字段
 *     （位图节点不改——切图像素已含着色效果；渐变 tint 极罕见，保留字段不下发）
 *  3. text.fills 下发：文本节点 fills 的纯色应用到全部 runs[].color 后删除 fills
 *     （Sketch 的图层色覆盖 run 色，Symbol 文本 override 的常见形态）
 *  4. gradient.css：线性渐变按节点实际宽高投影算出 CSS-ready 的 {angle, stops[].pct}
 *     （pct 可为负/超 100，浏览器沿渐变线外推；from/to/stops 保留作审计）
 *  5. 位图变换语义统一：带切图 url 的节点（不限类型）删除 rotation/flip——
 *     Sketch 的图层导出走渲染管线，所见即所得，图层自身变换必然烘焙进像素；
 *     保留字段会让消费端二次翻转。实证：path 下箭头（flip.y）与 shapeGroup 气泡
 *     （flip.x，切图 PNG 尖角方向与画板原图一致）都因保留字段被双重翻转；曾经支撑
 *     「group 栅格化不烘焙」的唯一反例（气泡不翻则反）经同一 URL 数据复核证实为
 *     误判。删除后 DSL 语义收敛为「rotation/flip 出现 = 消费端必须应用；不出现 =
 *     无需任何变换」。注意 group 切图 url 多为插件端 parse 后回填，本项在回填后的
 *     二次 bake（finalizeRestoreDsl 收口）才对这类节点生效。
 *  6. 描边直线矩形化：h≤1（或 w≤1）的 stroke-only 直线转成等效 fills 矩形
 *     （Sketch 直线的"粗细"在 border.thickness 上，消费端画 1pt 高 SVG 会裁掉描边）
 *  7. slice 切图上提：group 无 image 而其直接子级 slice 带同 frame 的切图 url 时，
 *     把 image 上提到 group 并补 renderHint=image（插件端对多层嵌套 icon 的回填不齐，
 *     统一在此兜底，消费端只认「group 带 image → 整组用位图」一条规则）
 */
import { RestoreNode, RestoreFill, RestoreGradient, RestoreGradientCss, RestoreFrame } from './restoreTypes';
import { round2 } from './normalize';

/** 两 frame 几何一致（±0.5pt，切图导出取整误差） */
const sameFrame = (a: RestoreFrame, b: RestoreFrame): boolean =>
    Math.abs(a.x - b.x) <= 0.5 && Math.abs(a.y - b.y) <= 0.5
    && Math.abs(a.w - b.w) <= 0.5 && Math.abs(a.h - b.h) <= 0.5;

/**
 * 线性渐变 → CSS-ready {angle, stops[].pct}。
 *
 * 两套坐标语义的换算（消费端最容易算错的点，故 parse 端一次算对）：
 *  - Sketch stops[].position 是「from→to 参数」比例（0=from 端、1=to 端），from/to 是
 *    相对节点 frame 的归一化坐标，可落在 [0,1] 外；
 *  - CSS linear-gradient 的 % 是「沿渐变方向、盒子四角投影范围」的比例（渐变线定义）。
 * 二者只在 from/to 恰好铺满盒子投影时相等。这里按节点实际宽高（非单位方）把 stop 位置
 * 投影到盒子上，pct 允许 <0 / >100（CSS 沿渐变线外推，正是 Sketch 的越界语义）。
 *
 * 返回 undefined 的情形（消费端 fallback 首个 stop 纯色）：非线性渐变、节点无面积、from==to。
 */
export const bakeGradientCss = (gradient: RestoreGradient, w: number, h: number): RestoreGradientCss | undefined => {
    if (gradient.type !== 'linear' || !(w > 0) || !(h > 0)) return undefined;
    if (!Array.isArray(gradient.from) || !Array.isArray(gradient.to) || !gradient.stops.length) return undefined;
    // 归一化坐标 × 实际宽高 → 像素向量（Sketch y 向下）
    const fx = gradient.from[0] * w;
    const fy = gradient.from[1] * h;
    const dx = gradient.to[0] * w - fx;
    const dy = gradient.to[1] * h - fy;
    const dot = dx * dx + dy * dy;
    if (dot < 1e-9) return undefined;
    // CSS 角度：0deg = to top、顺时针增；Sketch y 向下 → atan2(dx, -dy)
    const angle = Math.atan2(dx, -dy) * 180 / Math.PI;
    // 盒子四角在渐变方向上的投影范围 = CSS 渐变线的 0%~100%
    const projections: number[] = [];
    [[0, 0], [w, 0], [0, h], [w, h]].forEach((corner) => {
        projections.push(corner[0] * dx + corner[1] * dy);
    });
    const pmin = Math.min.apply(null, projections);
    const pmax = Math.max.apply(null, projections);
    const span = pmax - pmin;
    if (span < 1e-9) return undefined;
    const projFrom = fx * dx + fy * dy;
    return {
        angle: round2(angle),
        stops: gradient.stops.map(stop => ({
            color: stop.color,
            pct: round2((projFrom + stop.position * dot - pmin) / span * 100),
        })),
    };
};

/** fills/borders 数组里的线性渐变补 css 字段（建新对象，memo 缓存数组不原地改） */
const bakeGradientsIn = <T extends { gradient?: RestoreGradient }>(items: T[] | undefined, w: number, h: number): T[] | undefined => {
    if (!items || !items.length) return items;
    let changed = false;
    const next = items.map((item) => {
        if (!item.gradient || item.gradient.css) return item;
        const css = bakeGradientCss(item.gradient, w, h);
        if (!css) return item;
        changed = true;
        const gradient: RestoreGradient = { ...item.gradient, css };
        return { ...item, gradient };
    });
    return changed ? next : items;
};

/** 纯色 tint 应用到 fills：只重着色已有纯色项（Sketch tint 语义：重着色已绘制内容，不新增填充） */
const applyTintToFills = (fills: RestoreFill[] | undefined, tint: string): RestoreFill[] | undefined => {
    if (!fills || !fills.length) return fills;
    let changed = false;
    const next = fills.map((fill) => {
        if (!fill.color || fill.color === tint) return fill;
        changed = true;
        // token 是旧色的别名，重着色后不再成立，一并去掉（linkTokens 在 bake 后会按新色重新回填）
        const replaced: RestoreFill = { ...fill, color: tint };
        delete replaced.token;
        return replaced;
    });
    return changed ? next : fills;
};

/**
 * 单节点 bake（自顶向下 DFS）。
 * @param inheritedTint 祖先编组的纯色 tint（就近覆盖：自身 tint 优先于继承）
 */
const bakeNode = (node: RestoreNode, inheritedTint: string | undefined, isRoot: boolean): void => {
    // 1. 画板背景必填（组件定义树根不是画板，不适用）
    if (isRoot && node.type === 'artboard' && (!node.fills || !node.fills.length)) {
        node.fills = [{ color: '#FFFFFF' }];
    }

    // 2. tint 收敛：纯色 tint 下发（删字段）；渐变 tint 极罕见，保留字段、不参与下发
    let tint = inheritedTint;
    if (node.tint && node.tint.length) {
        const own = node.tint[0].color;
        if (own) {
            tint = own;
            delete node.tint;
        }
    }

    const isBitmap = !!(node.image && node.image.url);

    // 位图节点像素已含 tint 效果，样式字段不再重着色（保留矢量原样，供切图退化时回退）
    if (tint && !isBitmap) {
        node.fills = applyTintToFills(node.fills, tint);
        if (node.borders && node.borders.length) {
            let changed = false;
            const next = node.borders.map((border) => {
                if (!border.color || border.color === tint) return border;
                changed = true;
                return { ...border, color: tint };
            });
            if (changed) node.borders = next;
        }
    }

    // 3. text.fills 下发到 runs（图层色 > run 色），之后祖先 tint 再覆盖（tint > 图层色 > run 色）
    if (node.type === 'text' && node.runs && node.runs.length) {
        let overrideColor: string | undefined;
        if (node.fills && node.fills.length && node.fills[0].color) {
            overrideColor = node.fills[0].color;
            delete node.fills;
        }
        if (tint && !isBitmap) overrideColor = tint;
        if (overrideColor) {
            const color = overrideColor;
            let changed = false;
            const next = node.runs.map((run) => {
                if (run.color === color) return run;
                changed = true;
                // styleToken 绑定的是旧字色的样式组合，颜色变了别名失效，一并去掉
                const replaced = { ...run, color };
                delete replaced.styleToken;
                return replaced;
            });
            if (changed) node.runs = next;
        }
    }

    // 6. 描边直线矩形化：stroke-only 细直线 → 等效 fills 矩形。
    //    Sketch 对开放路径的描边实际按骑线（center）绘制，故短边居中扩到 thickness。
    //    判据收窄到"单条纯色实线描边 + 细直线 + 无子无位图"，防误伤真实矩形描边。
    if (node.type === 'path' && !isBitmap && !node.children
        && (!node.fills || !node.fills.length)
        && node.borders && node.borders.length === 1
        && node.borders[0].color && !node.borders[0].gradient && !node.borders[0].dash
        && (node.frame.h <= 1 || node.frame.w <= 1)
        && node.borders[0].thickness > Math.min(node.frame.w, node.frame.h)) {
        const thickness = node.borders[0].thickness;
        const color = node.borders[0].color!;
        // 方向判定先固化——expand 会原地换掉 node.frame，闭包里再读 node.frame.h 条件就失效
        const horizontal = node.frame.h <= 1;
        const expand = (frame: RestoreFrame): RestoreFrame => {
            if (horizontal) {
                return { x: frame.x, y: round2(frame.y - (thickness - frame.h) / 2), w: frame.w, h: thickness };
            }
            return { x: round2(frame.x - (thickness - frame.w) / 2), y: frame.y, w: thickness, h: frame.h };
        };
        node.frame = expand(node.frame);
        node.absFrame = expand(node.absFrame);
        node.type = 'rect';
        node.fills = [{ color }];
        delete node.borders;
        delete node.svgPath;
        delete node.windingRule;
    }

    // 4. gradient.css（在 tint/直线处理后算，用最终 fills/borders；直线转换产物无渐变不受影响）
    if (node.fills) node.fills = bakeGradientsIn(node.fills, node.frame.w, node.frame.h);
    if (node.borders) node.borders = bakeGradientsIn(node.borders, node.frame.w, node.frame.h);

    // 7. slice 切图上提：group 自身无切图、直接子级 slice 带同 frame 切图 → 上提 + renderHint
    if (!node.image && node.children) {
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            if (child.type === 'slice' && child.image && child.image.url && sameFrame(child.absFrame, node.absFrame)) {
                node.image = { ...child.image };
                if (!node.renderHint) node.renderHint = 'image';
                break;
            }
        }
    }

    // 5. 位图变换语义统一：切图像素是渲染管线产物、必含图层自身变换，带 url 一律删
    //    rotation/flip（含 group/shapeGroup 栅格化——「组位图未烘焙」旧结论经同一 URL
    //    数据复核为误判）。必须放在 slice 上提之后：上提会让原本无 image 的 group
    //    变成位图渲染节点，若提前判断会残留 rotation/flip，消费端会二次变换。
    if (node.image && node.image.url) {
        delete node.rotation;
        delete node.flip;
    }

    if (node.children) {
        node.children.forEach(child => bakeNode(child, tint, false));
    }
};

/**
 * RestoreDSL 树 CSS-ready 化（原地修改）。画板主树与 components[*].tree 都要过一遍。
 * 幂等：重复调用产出不变（tint/text.fills 首轮已删，gradient.css 已存在则跳过）。
 */
export const bakeRestoreTree = (root: RestoreNode): void => {
    bakeNode(root, undefined, true);
};

export default bakeRestoreTree;
