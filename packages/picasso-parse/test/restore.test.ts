/**
 * RestoreDSL / annotateStableIds 断言式单测（无测试框架，node/ts-node 直跑）。
 * 运行：npx ts-node test/restore.test.ts
 *
 * 覆盖：
 * 1. sha1 已知向量正确性
 * 2. 向后兼容：未经 annotate 的老输入跑存量 DSL，产物不含任何新增 key（条件写入护栏）
 * 3. 稳定性：同输入两次解析输出逐字节一致（验收④的单测形态）
 * 4. annotate 注入：B 副本（ID 全换）回填 A 侧稳定短哈希
 * 5. 复合 ID：Symbol 展开子树 = 实例短id/master图层短id；overrides 可读化
 * 6. 跨产物一致性：存量 measure DSL 与 RestoreDSL 同一原稿节点 stableId 逐值一致
 * 7. 缺省省略：RestoreDSL 输出无 visible:true / rotation:0 等缺省 key
 */
import * as fs from 'fs';
import * as path from 'path';
// 新导出必须走包主入口 import：src/index.ts 是点名导出制，直接引内部路径会漏掉
// 「parseRestoreDSL/index.ts 导出了但主入口没透传」这类断链
import {
    picassoArtboardCodeParse,
    picassoArtboardMeatureParse,
    picassoArtboardOperationCodeParse,
    picassoArtboardRestoreParse,
    annotateStableIds,
    assessRestoreDiffability,
    toRenderProfile,
    bakeRestoreTree,
} from '../src';
import sha1 from '../src/parseRestoreDSL/sha1';

let passed = 0;
let failed = 0;
const assert = (cond: boolean, message: string): void => {
    if (cond) {
        passed++;
    } else {
        failed++;
        console.error(`  ✗ ${message}`);
    }
};

const deepCopy = (obj: any): any => JSON.parse(JSON.stringify(obj));
const rawArtboard = JSON.parse(fs.readFileSync(path.join(__dirname, 'test_dsl.json'), 'utf8'));

// ---------- 1. sha1 已知向量 ----------
assert(sha1('abc') === 'a9993e364706816aba3e25717850c26c9cd0d89d', 'sha1("abc") 标准向量');
assert(sha1('') === 'da39a3ee5e6b4b0d3255bfef95601890afd80709', 'sha1("") 标准向量');
assert(sha1('中文字符串测试') === sha1('中文字符串测试'), 'sha1 UTF-8 稳定');

// ---------- 2. 向后兼容：未注入输入的存量 DSL 产物不含新增 key ----------
{
    const measure = picassoArtboardMeatureParse(deepCopy(rawArtboard));
    const text = JSON.stringify(measure);
    assert(text.indexOf('"stableId"') === -1, '未注入输入：measure DSL 不含 stableId key');
    assert(text.indexOf('"contentHash"') === -1, '未注入输入：measure DSL 不含 contentHash key');
    assert(text.indexOf('"subtreeHash"') === -1, '未注入输入：measure DSL 不含 subtreeHash key');
    assert(text.indexOf('"styleHash"') === -1, '未注入输入：measure DSL 不含 styleHash key');

    // 同输入两次解析逐字节一致
    const measure2 = picassoArtboardMeatureParse(deepCopy(rawArtboard));
    assert(text === JSON.stringify(measure2), '未注入输入：measure DSL 两次解析逐字节一致');
}

// ---------- 4. annotate 注入：模拟「副本 ID 全换」 ----------
const makeExportB = (a: any): any => {
    const b = deepCopy(a);
    let counter = 0;
    const rewriteIds = (node: any): void => {
        node.do_objectID = `COPY-${counter++}`;
        (node.layers || []).forEach(rewriteIds);
    };
    rewriteIds(b);
    return b;
};

{
    const exportA = deepCopy(rawArtboard);
    const exportB = makeExportB(exportA);
    annotateStableIds(exportB, exportA);

    assert(exportB.stableId === sha1(exportA.do_objectID).slice(0, 8), 'annotate：根节点 stableId = A 根 UUID 短哈希');

    let total = 0;
    let withStable = 0;
    let withHashes = 0;
    const walk = (node: any): void => {
        total++;
        if (node.stableId) withStable++;
        if (node.contentHash && node.subtreeHash) withHashes++;
        (node.layers || []).forEach(walk);
    };
    walk(exportB);
    assert(withHashes === total, `annotate：全部 ${total} 个节点注入 contentHash/subtreeHash`);
    // 样本含 symbolInstance（A 中为叶子），A/B 同构时全部节点可回填
    assert(withStable === total, `annotate：全部节点回填 stableId（实际 ${withStable}/${total}）`);

    // 幂等 / 确定性：两次独立注入结果一致
    const exportB2 = makeExportB(exportA);
    annotateStableIds(exportB2, deepCopy(exportA));
    const pickIds = (node: any, out: string[]): string[] => {
        out.push(`${node.stableId}|${node.contentHash}|${node.subtreeHash}`);
        (node.layers || []).forEach((c: any) => pickIds(c, out));
        return out;
    };
    assert(pickIds(exportB, []).join(',') === pickIds(exportB2, []).join(','), 'annotate：两次注入 stableId/hash 序列一致');

    // ---------- 6. 跨产物一致性：measure DSL 透传 = RestoreDSL 同节点 ----------
    const measure = picassoArtboardMeatureParse(deepCopy(exportB));
    const restore = picassoArtboardRestoreParse(deepCopy(exportA), exportB, undefined, { generatedAt: 'fixed' });

    // measure DSL 稳定 ID 在 stableId 字段；RestoreDSL 节点的 id 字段即 stableId
    const collectMap = (node: any, idKey: string, out: { [k: string]: string }): { [k: string]: string } => {
        if (node[idKey] && node.contentHash) out[node[idKey]] = node.contentHash;
        (node.children || []).forEach((c: any) => collectMap(c, idKey, out));
        return out;
    };
    const measureMap = collectMap(measure, 'stableId', {});
    const restoreMap = collectMap(restore.artboard, 'id', {});
    const measureIds = Object.keys(measureMap);
    let aligned = 0;
    measureIds.forEach((id) => {
        if (restoreMap[id] === measureMap[id]) aligned++;
    });
    assert(measureIds.length > 0, `一致性：measure DSL 携带 stableId 节点数 > 0（实际 ${measureIds.length}）`);
    assert(aligned === measureIds.length, `一致性：measure 与 RestoreDSL stableId/contentHash 逐值一致（${aligned}/${measureIds.length}）`);

    // styleHash 透传：注入后 measure DSL 至少有一个节点携带 styleHash，且值与 B 树上一致
    const collectStyleHash = (node: any, out: string[]): string[] => {
        if (node.styleHash) out.push(`${node.stableId || node.id}|${node.styleHash}`);
        (node.children || []).forEach((c: any) => collectStyleHash(c, out));
        return out;
    };
    const measureStyle = collectStyleHash(measure, []);
    const restoreStyle = collectStyleHash(restore.artboard, []);
    assert(measureStyle.length > 0, `styleHash 透传：measure DSL 携带 styleHash 节点数 > 0（实际 ${measureStyle.length}）`);
    const restoreStyleSet = new Set(restoreStyle);
    const styleAligned = measureStyle.filter((s) => restoreStyleSet.has(s)).length;
    assert(styleAligned === measureStyle.length, `styleHash 透传：measure 与 RestoreDSL styleHash 逐值一致（${styleAligned}/${measureStyle.length}）`);

    // ---------- 3./7. RestoreDSL 稳定性 + 缺省省略 ----------
    const exportB3 = makeExportB(exportA);
    const restore2 = picassoArtboardRestoreParse(deepCopy(exportA), exportB3, undefined, { generatedAt: 'fixed' });
    assert(JSON.stringify(restore) === JSON.stringify(restore2), 'RestoreDSL：同输入两次解析输出逐字节一致');

    const restoreText = JSON.stringify(restore);
    assert(restoreText.indexOf('"visible":true') === -1, 'RestoreDSL：不含 visible:true 缺省 key');
    assert(restoreText.indexOf('"rotation":0') === -1, 'RestoreDSL：不含 rotation:0 缺省 key');
    assert(restoreText.indexOf('"opacity":1') === -1, 'RestoreDSL：不含 opacity:1 缺省 key');
    assert(restore.schemaVersion === '1.1', 'RestoreDSL：schemaVersion = 1.1（Frame/布局语义增强）');
    assert(restore.meta.units === 'pt', 'RestoreDSL：meta.units = pt');
    assert(!!restore.artboard.absFrame, 'RestoreDSL：根节点携带 absFrame');
    assert(restore.artboard.frame.x === 0 && restore.artboard.frame.y === 0, 'RestoreDSL：根节点坐标归零');

    // 体积回归护栏：RestoreDSL 应显著小于原始导出 JSON（设计目标 ~15x，护栏放宽到 5x）
    const rawSize = JSON.stringify(rawArtboard).length;
    const restoreSize = restoreText.length;
    assert(restoreSize * 5 < rawSize, `体积护栏：RestoreDSL(${restoreSize}) < 原始(${rawSize}) / 5`);
}

// ---------- 5. 复合 ID + overrides 可读化（手工 fixture） ----------
{
    const baseFrame = { _class: 'rect', x: 0, y: 0, width: 100, height: 50 };
    const master: any = {
        _class: 'symbolMaster',
        do_objectID: 'M-ROOT',
        symbolID: 'SYM-1',
        name: '商品卡片',
        isVisible: true,
        frame: { ...baseFrame },
        layers: [
            {
                _class: 'text',
                do_objectID: 'M-T1',
                name: '标题',
                isVisible: true,
                frame: { _class: 'rect', x: 4, y: 4, width: 92, height: 20 },
                attributedString: { _class: 'attributedString', string: '占位标题', attributes: [] },
            },
            {
                _class: 'rectangle',
                do_objectID: 'M-R1',
                name: '背景',
                isVisible: true,
                frame: { _class: 'rect', x: 0, y: 0, width: 100, height: 50 },
            },
        ],
    };
    const exportA: any = {
        _class: 'artboard',
        do_objectID: 'A-ROOT',
        name: '画板',
        isVisible: true,
        hasBackgroundColor: true,
        backgroundColor: { _class: 'color', red: 0.9686274509803922, green: 0.9686274509803922, blue: 0.9686274509803922, alpha: 1 },
        frame: { _class: 'rect', x: 0, y: 0, width: 375, height: 200 },
        layers: [
            {
                _class: 'symbolInstance',
                do_objectID: 'A-I1',
                symbolID: 'SYM-1',
                name: '商品卡片',
                isVisible: true,
                frame: { _class: 'rect', x: 10, y: 20, width: 100, height: 50 },
                overrideValues: [
                    { _class: 'overrideValue', overrideName: 'M-T1_stringValue', value: 'iPhone 15' },
                    { _class: 'overrideValue', overrideName: 'M-T1_textStyle', value: { ignored: true } },
                ],
            },
        ],
    };
    const exportB: any = deepCopy(exportA);
    exportB.do_objectID = 'B-ROOT';
    exportB.layers[0] = {
        _class: 'group',
        do_objectID: 'B-G1',
        name: '商品卡片',
        isVisible: true,
        frame: { _class: 'rect', x: 10, y: 20, width: 100, height: 50 },
        layers: [
            {
                _class: 'text',
                do_objectID: 'B-T1',
                name: '标题',
                isVisible: true,
                frame: { _class: 'rect', x: 4, y: 4, width: 92, height: 20 },
                // attributes 为空：走图层级 textStyle 兜底合成整段 run
                attributedString: { _class: 'attributedString', string: 'iPhone 15', attributes: [] },
                style: {
                    _class: 'style',
                    textStyle: {
                        _class: 'textStyle',
                        encodedAttributes: {
                            MSAttributedStringFontAttribute: { _class: 'fontDescriptor', attributes: { name: 'PingFangSC-Medium', size: 16 } },
                            MSAttributedStringColorAttribute: { _class: 'color', red: 0.2, green: 0.2, blue: 0.2, alpha: 1 },
                        },
                    },
                },
            },
            {
                _class: 'rectangle',
                do_objectID: 'B-R1',
                name: '背景',
                isVisible: true,
                frame: { _class: 'rect', x: 0, y: 0, width: 100, height: 50 },
            },
        ],
    };

    const mastersC = [deepCopy(master)];
    annotateStableIds(exportB, deepCopy(exportA), mastersC);

    const instanceShort = sha1('A-I1').slice(0, 8);
    const detached = exportB.layers[0];
    assert(detached.stableId === instanceShort, '复合 ID：展开组 stableId = 实例短哈希');
    assert(detached.restoreComponentKey === sha1('SYM-1').slice(0, 8), '复合 ID：componentKey = symbolID 短哈希');
    assert(detached.stableId.length === 8, '短哈希：8 位十六进制');
    assert(detached.layers[0].stableId === `${instanceShort}/${sha1('M-T1').slice(0, 8)}`, '复合 ID：子树节点 = 实例短id/master图层短id');
    assert(detached.restoreOverrides && detached.restoreOverrides['标题'] === 'iPhone 15', 'overrides：path 解析为可读键（UUID → 图层名）');
    assert(detached.restoreOverrides && Object.keys(detached.restoreOverrides).length === 1, 'overrides：textStyle 等样式类 override 被跳过');

    const restore = picassoArtboardRestoreParse(deepCopy(exportA), exportB, mastersC, { generatedAt: 'fixed', pluginVersion: '9.9.9' });
    const key = sha1('SYM-1').slice(0, 8);
    assert(!!restore.components[key], 'components：字典 key = master symbolID 短哈希');
    assert(restore.components[key].name === '商品卡片', 'components：master 名称');
    assert(!!restore.components[key].tree, 'components：master 定义树在位');
    const cardNode = restore.artboard.children![0];
    assert(cardNode.componentKey === key, 'RestoreDSL：实例节点 componentKey 对齐 components 字典');
    assert(cardNode.overrides!['标题'] === 'iPhone 15', 'RestoreDSL：实例节点 overrides 可读键');
    assert(cardNode.children![0].id.indexOf('/') > -1, 'RestoreDSL：展开子树节点为复合 ID');
    assert(restore.meta.pluginVersion === '9.9.9', 'meta：pluginVersion 透传');

    // —— CSS-ready 行为（画板背景 / runs 兜底）——
    assert(
        !!restore.artboard.fills && restore.artboard.fills[0].color === '#F7F7F7',
        '画板背景色落 fills（hasBackgroundColor → fills[0]）',
    );
    const textNode = cardNode.children![0];
    assert(
        !!textNode.runs && textNode.runs.length === 1 && textNode.runs[0].font === 'PingFangSC-Medium' && textNode.runs[0].fontWeight === 500,
        'attributes 为空时从图层级 textStyle 兜底合成 runs',
    );
    assert(textNode.runs![0].len === 'iPhone 15'.length, '兜底 run 覆盖整段文本');
}

// ---------- 8. stableId / styleHash / effectiveLineHeight / renderProfile / diffability ----------
{
    const mkRect = (id: string, name: string, hex: [number, number, number], x: number): any => ({
        _class: 'rectangle',
        do_objectID: id,
        name,
        isVisible: true,
        frame: { _class: 'rect', x, y: 0, width: 40, height: 40 },
        style: {
            _class: 'style',
            fills: [{ _class: 'fill', isEnabled: true, fillType: 0, color: { _class: 'color', red: hex[0], green: hex[1], blue: hex[2], alpha: 1 } }],
        },
    });
    const exportA: any = {
        _class: 'artboard',
        do_objectID: 'A2-ROOT',
        name: '画板2',
        isVisible: true,
        frame: { _class: 'rect', x: 0, y: 0, width: 375, height: 200 },
        layers: [
            mkRect('A2-R1', '矩形', [1, 0, 0], 0),   // 红
            mkRect('A2-R2', '矩形', [0, 0, 1], 50),  // 蓝
            {
                _class: 'group',
                do_objectID: 'A2-G1',
                name: '图标组',
                isVisible: true,
                frame: { _class: 'rect', x: 100, y: 0, width: 40, height: 40 },
                style: {
                    _class: 'style',
                    fills: [{ _class: 'fill', isEnabled: true, fillType: 0, color: { _class: 'color', red: 0.6, green: 0.6, blue: 0.6, alpha: 1 } }],
                },
                layers: [mkRect('A2-R3', '子形状', [0, 0, 0], 0)],
            },
            {
                _class: 'text',
                do_objectID: 'A2-T1',
                name: '无行高文本',
                isVisible: true,
                frame: { _class: 'rect', x: 0, y: 100, width: 100, height: 20 },
                attributedString: { _class: 'attributedString', string: '测试', attributes: [] },
                style: {
                    _class: 'style',
                    textStyle: {
                        _class: 'textStyle',
                        encodedAttributes: {
                            MSAttributedStringFontAttribute: { _class: 'fontDescriptor', attributes: { name: 'PingFangSC-Regular', size: 14 } },
                        },
                    },
                },
            },
        ],
    };

    // —— 同名兄弟 z 序调换：stableId 必须跟内容走，不得按 index 错位注入 ——
    const exportB: any = deepCopy(exportA);
    let n = 0;
    const rewrite = (node: any): void => { node.do_objectID = `B2-${n++}`; (node.layers || []).forEach(rewrite); };
    rewrite(exportB);
    const tmp = exportB.layers[0];
    exportB.layers[0] = exportB.layers[1];
    exportB.layers[1] = tmp; // 蓝红调换
    annotateStableIds(exportB, deepCopy(exportA));
    assert(exportB.layers[0].stableId === sha1('A2-R2').slice(0, 8), '配对：z 序调换后蓝矩形仍拿到 A2-R2 的 stableId');
    assert(exportB.layers[1].stableId === sha1('A2-R1').slice(0, 8), '配对：z 序调换后红矩形仍拿到 A2-R1 的 stableId');
    assert(!!exportB.styleHash && exportB.styleHash.length === 8, 'annotate 注入 styleHash');

    // —— styleHash 几何解耦：仅移动 → contentHash 变、styleHash 不变 ——
    const moved: any = deepCopy(exportA);
    moved.layers[0].frame.x = 200;
    annotateStableIds(moved);
    const orig: any = deepCopy(exportA);
    annotateStableIds(orig);
    assert(orig.layers[0].contentHash !== moved.layers[0].contentHash, 'styleHash：移动后 contentHash 变化');
    assert(orig.layers[0].styleHash === moved.layers[0].styleHash, 'styleHash：移动后 styleHash 不变');

    // —— RestoreDSL 字段 ——
    const restore = picassoArtboardRestoreParse(deepCopy(exportA), deepCopy(exportA), undefined, { generatedAt: 'fixed' });
    const kids = restore.artboard.children!;
    const groupNode = kids.filter(k => k.name === '图标组')[0];
    // 纯色 tint 在 bake 阶段下发子孙后删除：组上不落 tint 也不落 fills，
    // 子形状的原色（黑）被重着色为组的着色色（灰）
    assert(!groupNode.tint && !groupNode.fills, 'tint：普通编组着色提示已下发删除（不落 tint/fills）');
    assert(!!groupNode.children && groupNode.children[0].fills![0].color === '#999999',
        'tint：着色色下发覆盖子形状 fills.color');
    const textNode = kids.filter(k => k.name === '无行高文本')[0];
    assert(textNode.effectiveLineHeight === 20, '行高兜底：单行无行高文本 effectiveLineHeight = frame 高');
    assert(textNode.runs![0].lineHeight === undefined, '行高兜底：不回写 runs（保护 hash 与 styleToken）');
    const rectNode = kids.filter(k => k.name === '矩形')[0];
    assert(!!rectNode.fills && !rectNode.tint, 'tint：形状节点 fills 语义不变');
    assert(!!rectNode.styleHash, 'RestoreDSL 节点透传 styleHash');

    // —— toRenderProfile 精简视图 ——
    const lean = toRenderProfile(restore);
    const leanText = JSON.stringify(lean);
    assert(leanText.indexOf('"contentHash"') === -1 && leanText.indexOf('"subtreeHash"') === -1
        && leanText.indexOf('"styleHash"') === -1, 'renderProfile：剥离三 hash');
    assert(Object.keys(lean.components).length === 0, 'renderProfile：components 清空');
    assert(JSON.stringify(restore).indexOf('"contentHash"') > -1, 'renderProfile：输入不被修改');

    // —— assessRestoreDiffability ——
    const same = assessRestoreDiffability(restore, restore);
    assert(same.verdict === 'same-artboard' && same.stableIdOverlap === 1, 'diffability：同版判定 same-artboard');
    const dup = toRenderProfile(restore); // 借精简视图当"复制画板"样本：id 保留原值,先手工抹掉
    const wipeIds = (node: any): void => { node.id = 'X' + node.id; (node.children || []).forEach(wipeIds); };
    wipeIds(dup.artboard);
    // 复制画板：id 全变、内容不变 —— 需要 hash 在位，用原 restore 深拷贝再抹 id
    const dup2 = JSON.parse(JSON.stringify(restore));
    wipeIds(dup2.artboard);
    const dupReport = assessRestoreDiffability(restore, dup2);
    assert(dupReport.verdict === 'duplicated-artboard', 'diffability：id 全变内容同源判定 duplicated-artboard');
    assert(dupReport.stableIdOverlap === 0 && dupReport.contentHashOverlap === 1, 'diffability：overlap 数值正确');
}

// ---------- 9. Sketch 2025 Frame/GraphicFrame 容器适配 ----------
// Frame 画板导出 JSON 的根 _class 是 'group'（groupBehavior 1），背景色是真实的 style.fills：
// 曾被普通编组的 fills→tint 重分类误伤，消费方按规范不渲染 tint → 整页底色全丢
{
    const mkFill = (r: number, g: number, b: number): any => ({
        _class: 'fill', isEnabled: true, fillType: 0,
        color: { _class: 'color', red: r, green: g, blue: b, alpha: 1 },
    });
    const mkChildRect = (id: string): any => ({
        _class: 'rectangle', do_objectID: id, name: '子形状', isVisible: true,
        frame: { _class: 'rect', x: 1, y: 1, width: 5, height: 5 },
        style: { _class: 'style' },
    });
    const frameRoot: any = {
        _class: 'group', groupBehavior: 1,   // Sketch 2025 Frame 画板
        do_objectID: 'F-ROOT', name: 'Frame画板', isVisible: true,
        frame: { _class: 'rect', x: 0, y: 0, width: 375, height: 200 },
        style: { _class: 'style', fills: [mkFill(0.960784, 0.964706, 0.980392)] },
        layers: [
            {
                _class: 'group', groupBehavior: 1,   // 嵌套 Frame：带背景填充的内容容器
                clipsContents: true,
                clippingBehavior: 1,
                horizontalSizing: 3,
                horizontalPins: 5,
                verticalSizing: 0,
                verticalPins: 1,
                do_objectID: 'F-NEST', name: '嵌套Frame', isVisible: true,
                frame: { _class: 'rect', x: 10, y: 10, width: 100, height: 50 },
                fixedRadius: 999,
                groupLayout: {
                    _class: 'MSImmutableFlexGroupLayout',
                    flexDirection: 0,
                    justifyContent: 1,
                    alignItems: 3,
                    allGuttersGap: 12,
                    wraps: true,
                },
                leftPadding: 4,
                topPadding: 6,
                rightPadding: 8,
                bottomPadding: 10,
                style: { _class: 'style', fills: [mkFill(1, 1, 1)] },
                layers: [mkChildRect('F-NR')],
            },
            {
                _class: 'group', groupBehavior: 1,   // Frame points 圆角：新版 Sketch 可能按四角写入 points
                do_objectID: 'F-RADIUS', name: '圆角Frame', isVisible: true,
                frame: { _class: 'rect', x: 130, y: 10, width: 80, height: 40 },
                points: [
                    { cornerRadius: 60 },
                    { cornerRadius: 30 },
                    { cornerRadius: 0 },
                    { cornerRadius: 20 },
                ],
                style: { _class: 'style' },
                layers: [],
            },
            {
                _class: 'group', groupBehavior: 1,   // Frame style.corners 圆角：Sketch 2025 会按 style.corners.radii 导出
                do_objectID: 'F-STYLE-CORNERS', name: '样式圆角Frame', isVisible: true,
                frame: { _class: 'rect', x: 220, y: 10, width: 80, height: 40 },
                style: {
                    _class: 'style',
                    corners: {
                        _class: 'MSImmutableStyleCorners',
                        radii: [60, 30, 0, 20],
                        style: 1,
                        smoothing: 0.6,
                        prefersConcentric: 1,
                    },
                    fills: [mkFill(1, 1, 1)],
                },
                layers: [],
            },
            {
                _class: 'group',   // 无 groupBehavior 的普通编组：tint 语义必须保持（回归护栏）
                do_objectID: 'F-G1', name: '图标组', isVisible: true,
                frame: { _class: 'rect', x: 10, y: 100, width: 40, height: 40 },
                style: { _class: 'style', fills: [mkFill(0.6, 0.6, 0.6)] },
                layers: [mkChildRect('F-GR')],
            },
        ],
    };
    const dsl = picassoArtboardRestoreParse(undefined, deepCopy(frameRoot), undefined, { generatedAt: 'fixed' });
    assert(dsl.artboard.type === 'artboard', 'Frame 适配：Frame 作解析根 type 归为 artboard');
    assert(!!dsl.artboard.fills && dsl.artboard.fills[0].color === '#F5F6FA' && !dsl.artboard.tint,
        'Frame 适配：画板背景落 fills 不落 tint');
    const nested = dsl.artboard.children!.filter(k => k.name === '嵌套Frame')[0];
    assert(nested.type === 'group' && !!nested.fills && nested.fills[0].color === '#FFFFFF' && !nested.tint,
        'Frame 适配：嵌套 Frame 的背景保持 fills 语义（type 仍为 group）');
    assert(nested.containerRole === 'frame' && nested.clipsContents === true,
        'Frame 适配：Frame 身份与裁剪语义显式输出');
    assert(JSON.stringify(nested.layoutConstraints) === JSON.stringify({
        horizontal: { raw: 3, mode: 'relative' },
        pins: { left: true, right: true, top: true, bottom: false, rawHorizontal: 5, rawVertical: 1 },
    }), 'Frame 适配：Sketch 2025 sizing/pins 归一为 layoutConstraints');
    assert(JSON.stringify(nested.stack) === JSON.stringify({
        direction: 'horizontal',
        gap: 12,
        spacing: 12,
        justifyContent: 'center',
        alignItems: 'stretch',
        wraps: true,
        padding: { left: 4, top: 6, right: 8, bottom: 10 },
    }), 'Frame 适配：Stack padding/gap/alignment 归一输出');
    assert(JSON.stringify(nested.borderRadius) === JSON.stringify([25, 25, 25, 25]),
        'Frame 适配：fixedRadius 超大值按短边一半 clamp 后落 borderRadius');
    const radiusFrame = dsl.artboard.children!.filter(k => k.name === '圆角Frame')[0];
    assert(JSON.stringify(radiusFrame.borderRadius) === JSON.stringify([20, 20, 0, 20]),
        'Frame 适配：Frame points.cornerRadius 可读取并按短边一半 clamp');
    const styleCornersFrame = dsl.artboard.children!.filter(k => k.name === '样式圆角Frame')[0];
    assert(JSON.stringify(styleCornersFrame.borderRadius) === JSON.stringify([20, 20, 0, 20]),
        'Frame 适配：Frame style.corners.radii 可读取并按短边一半 clamp');
    assert(JSON.stringify(styleCornersFrame.cornerHints) === JSON.stringify({
        rawStyle: 1,
        style: 'smooth',
        smoothing: 0.6,
        prefersConcentric: true,
    }), 'Frame 适配：Frame style.corners smooth/concentric 语义可读取');
    const measure = picassoArtboardMeatureParse(deepCopy(frameRoot)) as any;
    /**
     * 在 measure DSL 组件树中按名称查找节点。
     * @param node 当前搜索节点。
     * @param name 目标节点名称。
     * @returns 命中的节点；没有命中时返回 undefined。
     */
    const findMeasureNodeByName = (node: any, name: string): any => {
        // measure DSL 返回树结构，不能按数组顶层查找。
        if (!node) return undefined;
        if (node.name === name) return node;
        if (!Array.isArray(node.children)) return undefined;
        for (const child of node.children) {
            const matched = findMeasureNodeByName(child, name);
            if (matched) return matched;
        }
        return undefined;
    };
    const measureStyleCornersFrame = findMeasureNodeByName(measure, '样式圆角Frame');
    assert(JSON.stringify(measureStyleCornersFrame.panel.properties.radius) === JSON.stringify([20, 20, 0, 20])
        && JSON.stringify(measureStyleCornersFrame.style.borderRadius) === JSON.stringify({
            topLeft: 20,
            topRight: 20,
            bottomRight: 0,
            bottomLeft: 20,
        }),
        'Frame 适配：measure DSL 同步读取 Frame style.corners.radii');
    const measureNestedFrame = findMeasureNodeByName(measure, '嵌套Frame');
    assert(measureNestedFrame.containerRole === 'frame' && measureNestedFrame.clipsContents === true,
        'Frame 适配：measure DSL 只读透传 Frame 身份与裁剪语义');
    assert(measureNestedFrame.style.overflow === undefined,
        'Frame 适配：measure DSL 不因 clipsContents 改写 overflow 行为');
    assert(JSON.stringify(measureNestedFrame.layoutConstraints) === JSON.stringify({
        horizontal: { raw: 3, mode: 'relative' },
        pins: { left: true, right: true, top: true, bottom: false, rawHorizontal: 5, rawVertical: 1 },
    }), 'Frame 适配：measure DSL 只读透传 sizing/pins 约束语义');
    assert(JSON.stringify(measureNestedFrame.stack) === JSON.stringify({
        direction: 'horizontal',
        gap: 12,
        spacing: 12,
        justifyContent: 'center',
        alignItems: 'stretch',
        wraps: true,
        padding: { left: 4, top: 6, right: 8, bottom: 10 },
    }), 'Frame 适配：measure DSL 只读透传 Stack padding/gap/alignment');
    assert(JSON.stringify(measureStyleCornersFrame.cornerHints) === JSON.stringify({
        rawStyle: 1,
        style: 'smooth',
        smoothing: 0.6,
        prefersConcentric: true,
    }), 'Frame 适配：measure DSL 只读透传 smooth/concentric 圆角提示');
    /**
     * 检查 DSL 树中是否出现仅允许标注输出的 Sketch 2025 语义字段。
     * @param node 当前 DSL 节点。
     * @returns 任意节点带有标注元信息时返回 true；否则返回 false。
     */
    const hasMeasureOnlySemanticKey = (node: any): boolean => {
        if (!node) return false;
        // 这些字段属于标注展示信息，code/operation 默认链路不能被它们影响。
        if (
            node.containerRole !== undefined ||
            node.clipsContents !== undefined ||
            node.cornerHints !== undefined ||
            node.layoutConstraints !== undefined ||
            node.stack !== undefined
        ) {
            return true;
        }
        return Array.isArray(node.children) && node.children.some(hasMeasureOnlySemanticKey);
    };
    const code = picassoArtboardCodeParse(deepCopy(frameRoot)) as any;
    const operationCode = picassoArtboardOperationCodeParse(deepCopy(frameRoot)) as any;
    assert(!hasMeasureOnlySemanticKey(code) && !hasMeasureOnlySemanticKey(operationCode),
        'Frame 适配：code/operation DSL 默认不透传 measure-only 语义字段');
    const plainGroup = dsl.artboard.children!.filter(k => k.name === '图标组')[0];
    // 普通编组的着色提示不得误升为背景（fills）；纯色 tint 已下发删除，两字段皆无
    assert(!plainGroup.tint && !plainGroup.fills, 'Frame 适配：普通编组着色提示不落 fills（tint 已下发删除）');

    // symbolMaster 作解析根：backgroundColor 此前被静默丢弃
    const masterRoot: any = {
        _class: 'symbolMaster', do_objectID: 'M-ROOT', name: '组件画板', isVisible: true,
        frame: { _class: 'rect', x: 0, y: 0, width: 100, height: 100 },
        hasBackgroundColor: true,
        backgroundColor: { _class: 'color', red: 1, green: 1, blue: 1, alpha: 1 },
        layers: [mkChildRect('M-R1')],
    };
    const masterDsl = picassoArtboardRestoreParse(undefined, deepCopy(masterRoot), undefined, { generatedAt: 'fixed' });
    assert(!!masterDsl.artboard.fills && masterDsl.artboard.fills[0].color === '#FFFFFF',
        'Frame 适配：symbolMaster 作根时 backgroundColor 落 fills');

    // 分类只改 mapNode 输出，不碰 contentSignature：Frame 与普通 group 的 hash 行为一致
    const frameCopy = deepCopy(frameRoot);
    annotateStableIds(frameCopy);
    const plainCopy = deepCopy(frameRoot);
    delete plainCopy.groupBehavior;
    annotateStableIds(plainCopy);
    assert(frameCopy.contentHash !== plainCopy.contentHash,
        'Frame 适配：Frame 身份进入 contentHash（视觉语义变化应触发 diff）');
}

// ---------- 10. 评审修复回归（2026-07） ----------
// 覆盖：跨类同名换序配对 / componentRoot tint 语义 / dashPattern 0 段 / tint token 回填 /
// 降级兜底 id 跨次上传稳定 / idByDoObjectID 内部回传表
{
    const mkFill10 = (r: number, g: number, b: number): any => ({
        _class: 'fill', isEnabled: true, fillType: 0,
        color: { _class: 'color', red: r, green: g, blue: b, alpha: 1 },
    });
    const mkRect10 = (id: string, name: string, x: number, fill?: any): any => ({
        _class: 'rectangle', do_objectID: id, name, isVisible: true,
        frame: { _class: 'rect', x, y: 0, width: 40, height: 40 },
        style: { _class: 'style', fills: fill ? [fill] : [] },
    });

    // —— 跨类同名换序：A 两个同名实例（不同组件/不同 frame），B 解绑组数组顺序调换 ——
    // 重名复验守卫若写成 a._class === b._class 会在解绑场景（唯一允许跨类配对的场景）
    // 系统性跳过复验，stableId/componentKey 交叉错配；修复后按 frame 几何找回正主
    const mkInstance = (id: string, symbolID: string, x: number): any => ({
        _class: 'symbolInstance', do_objectID: id, symbolID, name: '按钮', isVisible: true,
        frame: { _class: 'rect', x, y: 0, width: 100, height: 40 },
    });
    const mkDetached = (id: string, x: number, childId: string): any => ({
        _class: 'group', do_objectID: id, name: '按钮', isVisible: true,
        frame: { _class: 'rect', x, y: 0, width: 100, height: 40 },
        layers: [mkRect10(childId, '底板', 0)],
    });
    const swapA: any = {
        _class: 'artboard', do_objectID: 'SW-ROOT', name: '换序画板', isVisible: true,
        frame: { _class: 'rect', x: 0, y: 0, width: 375, height: 100 },
        layers: [mkInstance('SW-I1', 'SYM-PRIMARY', 0), mkInstance('SW-I2', 'SYM-SECONDARY', 200)],
    };
    const swapB: any = deepCopy(swapA);
    swapB.do_objectID = 'SWB-ROOT';
    // 解绑 + z 序调换：SECONDARY（x=200）排到了数组第 0 位
    swapB.layers = [mkDetached('SWB-G2', 200, 'SWB-C2'), mkDetached('SWB-G1', 0, 'SWB-C1')];
    annotateStableIds(swapB, deepCopy(swapA));
    assert(swapB.layers[0].stableId === sha1('SW-I2').slice(0, 8)
        && swapB.layers[0].restoreComponentKey === sha1('SYM-SECONDARY').slice(0, 8),
        '换序修复：x=200 的解绑组拿到 SECONDARY 实例的 stableId/componentKey');
    assert(swapB.layers[1].stableId === sha1('SW-I1').slice(0, 8)
        && swapB.layers[1].restoreComponentKey === sha1('SYM-PRIMARY').slice(0, 8),
        '换序修复：x=0 的解绑组拿到 PRIMARY 实例的 stableId/componentKey');

    // —— componentRoot：图标类 master 根上的 fills 是着色提示（tint），不是页面底色 ——
    const iconMaster: any = {
        _class: 'symbolMaster', do_objectID: 'IM-ROOT', symbolID: 'SYM-ICON', name: '图标', isVisible: true,
        frame: { _class: 'rect', x: 0, y: 0, width: 40, height: 40 },
        style: { _class: 'style', fills: [mkFill10(0.6, 0.6, 0.6)] },
        layers: [mkRect10('IM-R1', '子路径', 0)],
    };
    const iconA: any = {
        _class: 'artboard', do_objectID: 'IC-ROOT', name: '图标画板', isVisible: true,
        frame: { _class: 'rect', x: 0, y: 0, width: 375, height: 100 },
        layers: [{
            _class: 'symbolInstance', do_objectID: 'IC-I1', symbolID: 'SYM-ICON', name: '图标', isVisible: true,
            frame: { _class: 'rect', x: 0, y: 0, width: 40, height: 40 },
        }],
    };
    const iconB: any = deepCopy(iconA);
    iconB.do_objectID = 'ICB-ROOT';
    iconB.layers[0] = {
        _class: 'group', do_objectID: 'ICB-G1', name: '图标', isVisible: true,
        frame: { _class: 'rect', x: 0, y: 0, width: 40, height: 40 },
        layers: [mkRect10('ICB-R1', '子路径', 0)],
    };
    const iconDsl = picassoArtboardRestoreParse(deepCopy(iconA), iconB, [deepCopy(iconMaster)], { generatedAt: 'fixed' });
    const iconTree = iconDsl.components[sha1('SYM-ICON').slice(0, 8)].tree!;
    // 定义树根的着色提示不得误升为背景；纯色 tint 已下发删除。子路径本身无填充（渲染无内容），
    // Sketch tint 只重着色已绘制内容——不给无填充子节点强加 fills
    assert(!iconTree.tint && !iconTree.fills, 'componentRoot：定义树根着色提示不落 fills（tint 已下发删除）');
    assert(!iconTree.children![0].fills, 'componentRoot：tint 不给无填充子节点强加 fills');
    // 同一 master 直接作解析根 = 页面语义，fills 保持背景（回归护栏）
    const iconRootDsl = picassoArtboardRestoreParse(undefined, deepCopy(iconMaster), undefined, { generatedAt: 'fixed' });
    assert(!!iconRootDsl.artboard.fills && !iconRootDsl.artboard.tint, 'componentRoot：master 直接作解析根仍是页面底色语义');

    // —— dashPattern：0 长度段合法（round-cap 圆点线），全 0 视为未设置 ——
    const mkDashRect = (id: string, dash: number[]): any => ({
        _class: 'rectangle', do_objectID: id, name: '虚线框', isVisible: true,
        frame: { _class: 'rect', x: 0, y: 0, width: 40, height: 40 },
        style: {
            _class: 'style',
            borders: [{ _class: 'border', isEnabled: true, fillType: 0, position: 1, thickness: 1, color: { _class: 'color', red: 0, green: 0, blue: 0, alpha: 1 } }],
            borderOptions: { _class: 'borderOptions', isEnabled: true, dashPattern: dash, lineCapStyle: 1, lineJoinStyle: 0 },
        },
    });
    const dashArt: any = {
        _class: 'artboard', do_objectID: 'DA-ROOT', name: '虚线画板', isVisible: true,
        frame: { _class: 'rect', x: 0, y: 0, width: 375, height: 100 },
        layers: [mkDashRect('DA-R1', [0, 8]), mkDashRect('DA-R2', [0, 0]), mkDashRect('DA-R3', [-1, 4])],
    };
    const dashDsl = picassoArtboardRestoreParse(undefined, deepCopy(dashArt), undefined, { generatedAt: 'fixed' });
    const dashKids = dashDsl.artboard.children!;
    assert(JSON.stringify(dashKids[0].borders![0].dash) === '[0,8]', 'dashPattern：[0,8] 圆点线 0 段保留');
    assert(dashKids[1].borders![0].dash === undefined, 'dashPattern：全 0 视为未设置');
    assert(JSON.stringify(dashKids[2].borders![0].dash) === '[4]', 'dashPattern：负数脏值剔除、正值保留');

    // —— tint token 回填：着色色不再是 designTokens 的孤儿槽位 ——
    const mkTintGroup = (id: string, x: number): any => ({
        _class: 'group', do_objectID: id, name: '着色组', isVisible: true,
        frame: { _class: 'rect', x, y: 0, width: 40, height: 40 },
        style: { _class: 'style', fills: [mkFill10(0.6, 0.6, 0.6)] },
        // 子形状带自己的原色（黑）——tint 下发是"重着色已有填充"，无填充子节点不适用
        layers: [mkRect10(`${id}-C`, '子形状', 0, mkFill10(0, 0, 0))],
    });
    const tintArt: any = {
        _class: 'artboard', do_objectID: 'TK-ROOT', name: '着色画板', isVisible: true,
        frame: { _class: 'rect', x: 0, y: 0, width: 375, height: 100 },
        layers: [mkTintGroup('TK-G1', 0), mkTintGroup('TK-G2', 50)],
    };
    const tintDsl = picassoArtboardRestoreParse(undefined, deepCopy(tintArt), undefined, { generatedAt: 'fixed' });
    const tintGroup = tintDsl.artboard.children![0];
    // 同频 token 按 hex 字典序 tiebreak（#000000 < #999999），token 名动态查表不硬编码
    const tintTokenName = Object.keys(tintDsl.designTokens.colors || {})
        .filter(name => tintDsl.designTokens.colors![name].value === '#999999')[0];
    assert(!!tintTokenName, 'tint token：着色色进 token 表');
    // tint 下发后组上无字段，token 回填落在被重着色的子形状 fills 上
    assert(!tintGroup.tint && tintGroup.children![0].fills![0].color === '#999999'
        && tintGroup.children![0].fills![0].token === tintTokenName,
        'tint token：下发后的子形状新色回填 token（不再是孤儿槽位）');

    // —— 降级兜底 id：do_objectID 全换（模拟两次上传的解绑副本）内容不变 → id 集一致 ——
    const degradeBase: any = {
        _class: 'artboard', do_objectID: 'DG-ROOT', name: '降级画板', isVisible: true,
        frame: { _class: 'rect', x: 0, y: 0, width: 375, height: 100 },
        layers: [mkRect10('DG-R1', '红', 0, mkFill10(1, 0, 0)), mkRect10('DG-R2', '蓝', 50, mkFill10(0, 0, 1))],
    };
    let seq1 = 0;
    let seq2 = 0;
    const d1: any = deepCopy(degradeBase);
    const rewrite1 = (node: any): void => { node.do_objectID = `RUN1-${seq1++}`; (node.layers || []).forEach(rewrite1); };
    rewrite1(d1);
    const d2: any = deepCopy(degradeBase);
    const rewrite2 = (node: any): void => { node.do_objectID = `RUN2-${seq2++}`; (node.layers || []).forEach(rewrite2); };
    rewrite2(d2);
    // exportA 缺省 = 降级为内容指纹模式（stableId 不注入，节点 id 走兜底）
    const dg1 = picassoArtboardRestoreParse(undefined, d1, undefined, { generatedAt: 'fixed' });
    const dg2 = picassoArtboardRestoreParse(undefined, d2, undefined, { generatedAt: 'fixed' });
    assert(JSON.stringify(dg1) === JSON.stringify(dg2),
        '降级兜底 id：do_objectID 全换内容不变时两次解析逐字节一致（含 id 集）');

    // —— hash-only 注入后再补 A 树：必须重新配对写 stableId ——
    const hashOnlyB: any = deepCopy(degradeBase);
    rewrite1(hashOnlyB);
    annotateStableIds(hashOnlyB);
    assert(!!hashOnlyB.contentHash && !hashOnlyB.stableId,
        '幂等补注入前置：缺 exportA 时只注入 contentHash，不注入 stableId');
    const stableAfterA = picassoArtboardRestoreParse(deepCopy(degradeBase), hashOnlyB, undefined, { generatedAt: 'fixed' });
    assert(hashOnlyB.stableId === sha1(degradeBase.do_objectID).slice(0, 8)
        && stableAfterA.artboard.id === hashOnlyB.stableId,
        '幂等补注入：hash-only B 后续带 exportA 解析时会补写 stableId');

    // —— idByDoObjectID 内部回传表：查得到、不落产物 ——
    assert(!!dg1.idByDoObjectID && dg1.idByDoObjectID['RUN1-1'] === dg1.artboard.children![0].id,
        'idByDoObjectID：B 侧 do_objectID 可查到 RestoreDSL 节点 id（含兜底 id）');
    assert(JSON.stringify(dg1).indexOf('idByDoObjectID') === -1,
        'idByDoObjectID：不可枚举，不落 JSON 产物');
}

// ---------- 10. CSS-ready 化（bake.ts） ----------
{
    const mkColor = (r: number, g: number, b: number, a?: number): any => (
        { _class: 'color', red: r, green: g, blue: b, alpha: a === undefined ? 1 : a });
    const mkSolidFill = (r: number, g: number, b: number): any => (
        { _class: 'fill', isEnabled: true, fillType: 0, color: mkColor(r, g, b) });

    // —— 画板背景必填：无 backgroundColor / 无 fills 的画板显式落白底 ——
    const bareArt: any = {
        _class: 'artboard', do_objectID: 'BK-ROOT', name: '裸画板', isVisible: true,
        frame: { _class: 'rect', x: 0, y: 0, width: 375, height: 100 },
        layers: [],
    };
    const bareDsl = picassoArtboardRestoreParse(undefined, deepCopy(bareArt), undefined, { generatedAt: 'fixed' });
    assert(!!bareDsl.artboard.fills && bareDsl.artboard.fills[0].color === '#FFFFFF',
        'bake 画板背景：无背景画板显式写白底（消费端删兜底链）');

    // —— fill 级 contextSettings.opacity 不并入 alpha ——
    // 该字段 UI 无入口（旧版本/导入残留），Sketch 渲染引擎实测忽略：15.反馈面试问题04
    // 三张底卡 fill 带 opacity=0.2 而官方导出原图为实色 #F5F7FA。曾经的乘入逻辑
    // 把它算成 #F5F7FA33，白底上近乎消失
    const ctxOpacityArt: any = {
        _class: 'artboard', do_objectID: 'CO-ROOT', name: '项级透明度画板', isVisible: true,
        frame: { _class: 'rect', x: 0, y: 0, width: 375, height: 100 },
        layers: [{
            _class: 'rectangle', do_objectID: 'CO-R1', name: '底卡', isVisible: true,
            frame: { _class: 'rect', x: 0, y: 0, width: 333, height: 88 },
            style: {
                _class: 'style',
                fills: [{
                    _class: 'fill', isEnabled: true, fillType: 0,
                    color: mkColor(0.961, 0.97, 0.98),
                    contextSettings: { _class: 'graphicsContextSettings', blendMode: 0, opacity: 0.2 },
                }],
            },
        }],
    };
    const ctxOpacityDsl = picassoArtboardRestoreParse(undefined, deepCopy(ctxOpacityArt), undefined, { generatedAt: 'fixed' });
    const ctxRect = ctxOpacityDsl.artboard.children![0];
    assert(!!ctxRect.fills && ctxRect.fills[0].color === '#F5F7FA',
        'fills 归一化：fill.contextSettings.opacity 忽略不并入 alpha（Sketch 渲染实测不生效）');

    // —— text.fills 下发 runs[].color 后删除 ——
    const textArt: any = {
        _class: 'artboard', do_objectID: 'TF-ROOT', name: '文本画板', isVisible: true,
        frame: { _class: 'rect', x: 0, y: 0, width: 375, height: 100 },
        layers: [{
            _class: 'text', do_objectID: 'TF-T1', name: '覆盖色文本', isVisible: true,
            frame: { _class: 'rect', x: 0, y: 0, width: 100, height: 20 },
            style: { _class: 'style', fills: [mkSolidFill(1, 0, 0)] },
            attributedString: {
                _class: 'attributedString', string: '文字',
                attributes: [{
                    location: 0, length: 2,
                    attributes: {
                        MSAttributedStringFontAttribute: { _class: 'fontDescriptor', attributes: { name: 'PingFangSC-Regular', size: 14 } },
                        MSAttributedStringColorAttribute: mkColor(0, 0, 0),
                    },
                }],
            },
        }],
    };
    const textDsl = picassoArtboardRestoreParse(undefined, deepCopy(textArt), undefined, { generatedAt: 'fixed' });
    const coloredText = textDsl.artboard.children![0];
    assert(!coloredText.fills && coloredText.runs![0].color === '#FF0000',
        'bake text.fills：图层色下发 runs[].color 后删除 fills');

    // —— gradient.css：线性渐变按节点实际宽高投影预算 CSS 角度/百分位 ——
    const gradArt: any = {
        _class: 'artboard', do_objectID: 'GC-ROOT', name: '渐变画板', isVisible: true,
        frame: { _class: 'rect', x: 0, y: 0, width: 375, height: 100 },
        layers: [{
            _class: 'rectangle', do_objectID: 'GC-R1', name: '渐变块', isVisible: true,
            frame: { _class: 'rect', x: 0, y: 0, width: 100, height: 50 },
            style: {
                _class: 'style',
                fills: [{
                    _class: 'fill', isEnabled: true, fillType: 1,
                    gradient: {
                        _class: 'gradient', gradientType: 0,
                        from: '{0.5, 0}', to: '{0.5, 1}',
                        stops: [
                            { _class: 'gradientStop', position: 0, color: mkColor(1, 1, 1) },
                            { _class: 'gradientStop', position: 1, color: mkColor(0, 0, 0) },
                        ],
                    },
                }],
            },
        }],
    };
    const gradDsl = picassoArtboardRestoreParse(undefined, deepCopy(gradArt), undefined, { generatedAt: 'fixed' });
    const gradCss = gradDsl.artboard.children![0].fills![0].gradient!.css!;
    assert(gradCss.angle === 180 && gradCss.stops[0].pct === 0 && gradCss.stops[1].pct === 100,
        'bake gradient.css：满铺竖向渐变 = 180deg / 0%~100%');

    // —— 描边直线矩形化：h=1 stroke-only 直线 → 等效 fills 矩形（短边居中扩 thickness）——
    const lineArt: any = {
        _class: 'artboard', do_objectID: 'LN-ROOT', name: '直线画板', isVisible: true,
        frame: { _class: 'rect', x: 0, y: 0, width: 375, height: 100 },
        layers: [{
            _class: 'shapePath', do_objectID: 'LN-P1', name: '直线', isVisible: true,
            frame: { _class: 'rect', x: 10, y: 20, width: 24, height: 1 },
            isClosed: false,
            points: [
                { _class: 'curvePoint', point: '{0, 0.5}', curveMode: 1 },
                { _class: 'curvePoint', point: '{1, 0.5}', curveMode: 1 },
            ],
            style: {
                _class: 'style',
                borders: [{ _class: 'border', isEnabled: true, fillType: 0, position: 0, thickness: 4, color: mkColor(0, 0.84, 0.49) }],
            },
        }],
    };
    const lineDsl = picassoArtboardRestoreParse(undefined, deepCopy(lineArt), undefined, { generatedAt: 'fixed' });
    const bakedLine = lineDsl.artboard.children![0];
    assert(bakedLine.type === 'rect' && !bakedLine.borders && !bakedLine.svgPath
        && !!bakedLine.fills && bakedLine.fills[0].color === '#00D67D'
        && bakedLine.frame.h === 4 && bakedLine.frame.y === 18.5 && bakedLine.frame.w === 24,
        'bake 直线矩形化：stroke-only 细直线转 fills 矩形（骑线居中扩 thickness）');
    // absFrame 与 frame 同方向扩（回归护栏：expand 先换 frame 再算 absFrame 时方向判定不得失效）
    assert(bakedLine.absFrame.h === 4 && bakedLine.absFrame.y === 18.5 && bakedLine.absFrame.w === 24,
        'bake 直线矩形化：absFrame 与 frame 同方向扩 thickness');

    // —— 位图变换语义统一：带切图 url 删 rotation/flip；无位图的矢量组保留 ——
    const flipArt: any = {
        _class: 'artboard', do_objectID: 'FL-ROOT', name: '翻转画板', isVisible: true,
        frame: { _class: 'rect', x: 0, y: 0, width: 375, height: 200 },
        layers: [
            {
                _class: 'image', do_objectID: 'FL-I1', name: '已烘焙位图', isVisible: true,
                isFlippedHorizontal: true, rotation: 0,
                frame: { _class: 'rect', x: 0, y: 0, width: 40, height: 40 },
                imageUrl: 'https://example.com/baked.png',
            },
            {
                _class: 'group', do_objectID: 'FL-G1', name: '未烘焙组位图', isVisible: true,
                isFlippedHorizontal: true,
                frame: { _class: 'rect', x: 50, y: 0, width: 40, height: 40 },
                layers: [],
            },
        ],
    };
    const flipDsl = picassoArtboardRestoreParse(undefined, deepCopy(flipArt), undefined, { generatedAt: 'fixed' });
    const bakedImage = flipDsl.artboard.children![0];
    const groupVector = flipDsl.artboard.children![1];
    assert(bakedImage.type === 'image' && !bakedImage.flip && !bakedImage.rotation,
        'bake 位图变换：type=image 切图节点 rotation/flip 删除（像素已烘焙）');
    assert(!!groupVector.flip && groupVector.flip.x === true,
        'bake 位图变换：无位图的矢量 group flip 保留（消费端须应用）');
    // group 切图 url 是插件端 parse 后回填的：模拟回填后的二次 bake（finalizeRestoreDsl 收口），
    // 栅格化位图同样是渲染管线产物、已含组自身变换，flip 必须删——保留会被消费端双重翻转
    // （实证：01「签到领取空跑赔30元」shapeGroup 气泡，切图尖角方向与画板原图一致）
    groupVector.image = { url: 'https://example.com/group-baked.png' };
    groupVector.renderHint = 'image';
    bakeRestoreTree(flipDsl.artboard);
    assert(!groupVector.flip && !groupVector.rotation,
        'bake 位图变换：切图 url 回填后的 group 二次 bake 删 rotation/flip（栅格化已烘焙组变换）');

    // —— slice 切图上提：group 无 image、同 frame 子 slice 带切图 → 上提 + renderHint ——
    // 生产流程里切图 URL 是插件端在 parse 之后按 stableId 回填的，parse 时 bake 看不到；
    // 插件端回填后需再调一次 bakeRestoreTree（幂等）。这里直接对回填后的 DSL 树测 bake
    const liftedTree: any = {
        id: 'g1', type: 'group', name: 'icon组',
        frame: { x: 0, y: 0, w: 52, h: 52 }, absFrame: { x: 0, y: 0, w: 52, h: 52 },
        rotation: 45, flip: { x: true },
        children: [
            {
                id: 'r1', type: 'rect', name: '形状',
                frame: { x: 4, y: 4, w: 44, h: 44 }, absFrame: { x: 4, y: 4, w: 44, h: 44 },
                fills: [{ color: '#ADBBCC' }],
            },
            {
                id: 's1', type: 'slice', name: 'icon切片',
                frame: { x: 0, y: 0, w: 52, h: 52 }, absFrame: { x: 0, y: 0, w: 52, h: 52 },
                image: { url: 'https://example.com/icon.png' },
            },
        ],
    };
    bakeRestoreTree(liftedTree);
    assert(!!liftedTree.image && liftedTree.image.url === 'https://example.com/icon.png'
        && liftedTree.renderHint === 'image' && !liftedTree.rotation && !liftedTree.flip,
        'bake slice 上提：同 frame 子 slice 的切图上提到 group，并删除已烘焙变换');
    // 幂等护栏：重复 bake 产出不变
    const liftedOnce = JSON.stringify(liftedTree);
    bakeRestoreTree(liftedTree);
    assert(JSON.stringify(liftedTree) === liftedOnce, 'bake slice 上提：重复 bake 幂等');

    // —— trimByMask 渐变重映射：被裁剪图层的 from/to 归一化基准换到新 frame ——
    const maskArt: any = {
        _class: 'artboard', do_objectID: 'MK-ROOT', name: '蒙版画板', isVisible: true,
        frame: { _class: 'rect', x: 0, y: 0, width: 375, height: 100 },
        layers: [
            {
                _class: 'rectangle', do_objectID: 'MK-M1', name: '蒙版', isVisible: true,
                hasClippingMask: true,
                frame: { _class: 'rect', x: 0, y: 0, width: 100, height: 100 },
            },
            {
                // 原 frame 高 200、下半被蒙版裁掉 → 新 frame 高 100。
                // 原 from={0.5,0} to={0.5,1}（相对 200 高）在新 frame 下应重映射为 to={0.5,2}
                _class: 'rectangle', do_objectID: 'MK-R1', name: '被裁渐变', isVisible: true,
                frame: { _class: 'rect', x: 0, y: 0, width: 100, height: 200 },
                style: {
                    _class: 'style',
                    fills: [{
                        _class: 'fill', isEnabled: true, fillType: 1,
                        gradient: {
                            _class: 'gradient', gradientType: 0,
                            from: '{0.5, 0}', to: '{0.5, 1}',
                            stops: [
                                { _class: 'gradientStop', position: 0, color: mkColor(1, 1, 1) },
                                { _class: 'gradientStop', position: 1, color: mkColor(0, 0, 0) },
                            ],
                        },
                    }],
                },
            },
        ],
    };
    const maskDsl = picassoArtboardRestoreParse(undefined, deepCopy(maskArt), undefined, { generatedAt: 'fixed' });
    const clipped = maskDsl.artboard.children!.filter(k => k.name === '被裁渐变')[0];
    const remapped = clipped.fills![0].gradient!;
    assert(clipped.frame.h === 100 && remapped.to[1] === 2 && remapped.from[1] === 0,
        'trimByMask 渐变重映射：frame 裁半后 to.y 重映射为 2（世界坐标方向不变）');

    // —— 幂等 & 稳定：同输入两次解析逐字节一致（bake 不引入随机性）——
    const again = picassoArtboardRestoreParse(undefined, deepCopy(maskArt), undefined, { generatedAt: 'fixed' });
    assert(JSON.stringify(maskDsl) === JSON.stringify(again), 'bake 稳定性：同输入两次解析逐字节一致');
}

console.log(`\nrestore.test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
