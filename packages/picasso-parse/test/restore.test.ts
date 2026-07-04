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
    picassoArtboardMeatureParse,
    picassoArtboardRestoreParse,
    annotateStableIds,
    assessRestoreDiffability,
    toRenderProfile,
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

    // ---------- 3./7. RestoreDSL 稳定性 + 缺省省略 ----------
    const exportB3 = makeExportB(exportA);
    const restore2 = picassoArtboardRestoreParse(deepCopy(exportA), exportB3, undefined, { generatedAt: 'fixed' });
    assert(JSON.stringify(restore) === JSON.stringify(restore2), 'RestoreDSL：同输入两次解析输出逐字节一致');

    const restoreText = JSON.stringify(restore);
    assert(restoreText.indexOf('"visible":true') === -1, 'RestoreDSL：不含 visible:true 缺省 key');
    assert(restoreText.indexOf('"rotation":0') === -1, 'RestoreDSL：不含 rotation:0 缺省 key');
    assert(restoreText.indexOf('"opacity":1') === -1, 'RestoreDSL：不含 opacity:1 缺省 key');
    assert(restore.schemaVersion === '1.2', 'RestoreDSL：schemaVersion = 1.2');
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

    // —— 1.1 新增行为 ——
    assert(
        !!restore.artboard.fills && restore.artboard.fills[0].color === '#F7F7F7',
        '1.1：画板背景色落 fills（hasBackgroundColor → fills[0]）',
    );
    const textNode = cardNode.children![0];
    assert(
        !!textNode.runs && textNode.runs.length === 1 && textNode.runs[0].font === 'PingFangSC-Medium' && textNode.runs[0].fontWeight === 500,
        '1.1：attributes 为空时从图层级 textStyle 兜底合成 runs',
    );
    assert(textNode.runs![0].len === 'iPhone 15'.length, '1.1：兜底 run 覆盖整段文本');
}

// ---------- 8. [1.2] 新增行为 ----------
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
    assert(exportB.layers[0].stableId === sha1('A2-R2').slice(0, 8), '1.2 配对：z 序调换后蓝矩形仍拿到 A2-R2 的 stableId');
    assert(exportB.layers[1].stableId === sha1('A2-R1').slice(0, 8), '1.2 配对：z 序调换后红矩形仍拿到 A2-R1 的 stableId');
    assert(!!exportB.styleHash && exportB.styleHash.length === 8, '1.2：annotate 注入 styleHash');

    // —— styleHash 几何解耦：仅移动 → contentHash 变、styleHash 不变 ——
    const moved: any = deepCopy(exportA);
    moved.layers[0].frame.x = 200;
    annotateStableIds(moved);
    const orig: any = deepCopy(exportA);
    annotateStableIds(orig);
    assert(orig.layers[0].contentHash !== moved.layers[0].contentHash, '1.2 styleHash：移动后 contentHash 变化');
    assert(orig.layers[0].styleHash === moved.layers[0].styleHash, '1.2 styleHash：移动后 styleHash 不变');

    // —— RestoreDSL 1.2 字段 ——
    const restore = picassoArtboardRestoreParse(deepCopy(exportA), deepCopy(exportA), undefined, { generatedAt: 'fixed' });
    const kids = restore.artboard.children!;
    const groupNode = kids.filter(k => k.name === '图标组')[0];
    assert(!!groupNode.tint && !groupNode.fills, '1.2 tint：普通编组 fills 落 tint 不落 fills');
    const textNode = kids.filter(k => k.name === '无行高文本')[0];
    assert(textNode.effectiveLineHeight === 20, '1.2 行高兜底：单行无行高文本 effectiveLineHeight = frame 高');
    assert(textNode.runs![0].lineHeight === undefined, '1.2 行高兜底：不回写 runs（保护 hash 与 styleToken）');
    const rectNode = kids.filter(k => k.name === '矩形')[0];
    assert(!!rectNode.fills && !rectNode.tint, '1.2 tint：形状节点 fills 语义不变');
    assert(!!rectNode.styleHash, '1.2：RestoreDSL 节点透传 styleHash');

    // —— toRenderProfile 精简视图 ——
    const lean = toRenderProfile(restore);
    const leanText = JSON.stringify(lean);
    assert(leanText.indexOf('"contentHash"') === -1 && leanText.indexOf('"subtreeHash"') === -1
        && leanText.indexOf('"styleHash"') === -1, '1.2 renderProfile：剥离三 hash');
    assert(Object.keys(lean.components).length === 0, '1.2 renderProfile：components 清空');
    assert(JSON.stringify(restore).indexOf('"contentHash"') > -1, '1.2 renderProfile：输入不被修改');

    // —— assessRestoreDiffability ——
    const same = assessRestoreDiffability(restore, restore);
    assert(same.verdict === 'same-artboard' && same.stableIdOverlap === 1, '1.2 diffability：同版判定 same-artboard');
    const dup = toRenderProfile(restore); // 借精简视图当"复制画板"样本：id 保留原值,先手工抹掉
    const wipeIds = (node: any): void => { node.id = 'X' + node.id; (node.children || []).forEach(wipeIds); };
    wipeIds(dup.artboard);
    // 复制画板：id 全变、内容不变 —— 需要 hash 在位，用原 restore 深拷贝再抹 id
    const dup2 = JSON.parse(JSON.stringify(restore));
    wipeIds(dup2.artboard);
    const dupReport = assessRestoreDiffability(restore, dup2);
    assert(dupReport.verdict === 'duplicated-artboard', '1.2 diffability：id 全变内容同源判定 duplicated-artboard');
    assert(dupReport.stableIdOverlap === 0 && dupReport.contentHashOverlap === 1, '1.2 diffability：overlap 数值正确');
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
                do_objectID: 'F-NEST', name: '嵌套Frame', isVisible: true,
                frame: { _class: 'rect', x: 10, y: 10, width: 100, height: 50 },
                style: { _class: 'style', fills: [mkFill(1, 1, 1)] },
                layers: [mkChildRect('F-NR')],
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
    const plainGroup = dsl.artboard.children!.filter(k => k.name === '图标组')[0];
    assert(!!plainGroup.tint && !plainGroup.fills, 'Frame 适配：普通编组 fills→tint 语义不回归');

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
    assert(frameCopy.contentHash === plainCopy.contentHash,
        'Frame 适配：groupBehavior 不入 contentHash（历史指纹零漂移）');
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
    assert(!!iconTree.tint && !iconTree.fills, 'componentRoot：定义树根 fills 维持 tint 语义（不误升为背景）');
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
        layers: [mkRect10(`${id}-C`, '子形状', 0)],
    });
    const tintArt: any = {
        _class: 'artboard', do_objectID: 'TK-ROOT', name: '着色画板', isVisible: true,
        frame: { _class: 'rect', x: 0, y: 0, width: 375, height: 100 },
        layers: [mkTintGroup('TK-G1', 0), mkTintGroup('TK-G2', 50)],
    };
    const tintDsl = picassoArtboardRestoreParse(undefined, deepCopy(tintArt), undefined, { generatedAt: 'fixed' });
    const tintGroup = tintDsl.artboard.children![0];
    assert(!!tintDsl.designTokens.colors && tintDsl.designTokens.colors['color-1'].value === '#999999',
        'tint token：着色色进 token 表');
    assert(!!tintGroup.tint && tintGroup.tint[0].token === 'color-1', 'tint token：tint[].token 回填（不再是孤儿槽位）');

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

    // —— idByDoObjectID 内部回传表：查得到、不落产物 ——
    assert(!!dg1.idByDoObjectID && dg1.idByDoObjectID['RUN1-1'] === dg1.artboard.children![0].id,
        'idByDoObjectID：B 侧 do_objectID 可查到 RestoreDSL 节点 id（含兜底 id）');
    assert(JSON.stringify(dg1).indexOf('idByDoObjectID') === -1,
        'idByDoObjectID：不可枚举，不落 JSON 产物');
}

console.log(`\nrestore.test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
