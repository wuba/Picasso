/**
 * 公开原始事实 API、历史入口与确定性 renderer 的行为回归。
 * 原始事实只通过包主入口获取，避免源码存在而外部无法调用。
 */
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as vm from 'vm';
import * as ts from 'typescript';
import {
    analyzeRestoreVisuals, picassoArtboardRestoreParse, picassoArtboardMeatureParse,
    picassoArtboardCodeParse, picassoArtboardOperationCodeParse, picassoArtboardLowcodeParse,
    PARSER_VERSION, RESTORE_SCHEMA_VERSION,
} from '../src';

/** 克隆 JSON 测试输入，隔离会原地改写输入的历史解析 API。 */
const copy = (value: any): any => JSON.parse(JSON.stringify(value));

/** 递归冻结原始输入，任何采集阶段的写入都会让测试失败。 */
const freeze = (value: any): any => {
    if (value && typeof value === 'object') {
        Object.keys(value).forEach(key => freeze(value[key]));
        Object.freeze(value);
    }
    return value;
};

/** 构造显式可见、具有稳定原始 ID 的测试节点。 */
const layer = (id: string, additions: any = {}): any => ({
    _class: 'rectangle', do_objectID: id, name: id, isVisible: true,
    frame: { x: 10.123456, y: 20, width: 80, height: 40 }, ...additions,
});

/** 构造原始画板，保留传入的展开图层顺序。 */
const board = (layers: any[]): any => layer('RAW-ROOT', {
    _class: 'artboard', frame: { x: 30, y: 40, width: 300, height: 200 }, layers,
});

const raw = board([
    layer('MASK', { hasClippingMask: true, clippingMaskMode: 1 }),
    layer('PAINT', {
        stableId: 'paired-node',
        glyphBounds: '{{1.234567, 2}, {30, 40}}',
        textBehaviour: 1,
        attributedString: { string: '原始字', attributes: [{ location: 0, length: 3, attributes: {
            MSAttributedStringFontAttribute: { attributes: { name: 'Fixture-Semibold', size: 17.123456 } },
            paragraphStyle: { minimumLineHeight: 20, maximumLineHeight: 30, paragraphSpacing: 4, headIndent: 3 },
        } }] },
        style: {
            contextSettings: { blendMode: 3, opacity: 0.6 },
            fills: [
                { isEnabled: false, fillType: 8 },
                { isEnabled: true, fillType: 5, noiseIndex: 2, noiseIntensity: 0.4 },
                { isEnabled: true, fillType: 1, gradient: { gradientType: 1, elipseLength: 0.321456, from: '{0,0}', to: '{1,1}', stops: [] } },
                { isEnabled: true, fillType: 4, image: { _ref: 'images/original' }, patternFillType: 0, patternTileScale: 0.25, patternTransform: [1, 0, 0, 1, 10, 20] },
                { isEnabled: true, fillType: 1, gradient: { gradientType: 9, stops: [] } },
            ],
            borders: [{ isEnabled: true, contextSettings: { blendMode: 2 } }],
            blurs: [{ isEnabled: true, type: 1, radius: 12, motionAngle: 30 }, { isEnabled: true, type: 3, radius: 8, center: '{0.2,0.8}' }],
            textStyle: { encodedAttributes: { paragraphStyle: { alignment: 2 } } },
        },
        layers: [layer('NESTED', { shouldBreakMaskChain: true })],
    }),
    layer('BREAK', { shouldBreakMaskChain: true }),
    layer('BOOLEAN', { _class: 'shapeGroup', booleanOperation: 2, points: [{ point: '{0.1, 0.2}' }] }),
]);
const before = JSON.stringify(raw);
const analysis = analyzeRestoreVisuals(freeze(raw));
assert.strictEqual(JSON.stringify(raw), before, '采集不能修改输入或注入 ID/hash');
assert.strictEqual(analysis.reportVersion, 1);
assert.strictEqual(Object.keys(analysis.nodesByObjectId).length, 6);
assert.deepStrictEqual(analysis.nodesByObjectId.PAINT.maskChain, ['MASK']);
assert.deepStrictEqual(analysis.nodesByObjectId.NESTED.maskChain, ['MASK'], '断开本级蒙版不应移除祖先作用域的蒙版');
assert.strictEqual(analysis.nodesByObjectId.BREAK.maskChain, undefined);
assert.ok(analysis.issues.some(issue => issue.objectId === 'NESTED' && issue.code === 'MASK_CHAIN' && issue.captureOwnerId === 'RAW-ROOT'), '蒙版补拍范围应包含来自祖先作用域的mask');
const paint = analysis.nodesByObjectId.PAINT;
assert.strictEqual(paint.parentObjectId, 'RAW-ROOT');
assert.strictEqual(paint.stableId, 'paired-node');
assert.strictEqual(paint.raw.frame.x, 10.123456, '原始坐标不应被 round2');
assert.strictEqual(paint.raw.style.fills[2].gradient.elipseLength, 0.321456);
assert.strictEqual(paint.raw.style.fills[3].patternTileScale, 0.25);
assert.deepStrictEqual(Array.from(paint.raw.style.fills[3].patternTransform), [1, 0, 0, 1, 10, 20]);
assert.strictEqual(paint.raw.style.blurs[0].motionAngle, 30);
assert.strictEqual(paint.raw.style.blurs[1].center, '{0.2,0.8}');
assert.strictEqual(paint.raw.glyphBounds, '{{1.234567, 2}, {30, 40}}');
assert.strictEqual(paint.raw.attributedString.attributes[0].attributes.paragraphStyle.paragraphSpacing, 4);
assert.strictEqual(paint.raw.attributedString.attributes[0].attributes.MSAttributedStringFontAttribute.attributes.size, 17.123456);
paint.raw.style.fills[2].gradient.elipseLength = 2;
assert.strictEqual(raw.layers[1].style.fills[2].gradient.elipseLength, 0.321456, '报告与输入应完全隔离');
const issues = analysis.issues.filter(issue => issue.objectId === 'PAINT');
assert.strictEqual(issues.find(issue => issue.code === 'UNSUPPORTED_FILL')!.index, 1, '索引不能在过滤禁用 fills 后重排');
assert.ok(issues.every(issue => issue.dslId === 'paired-node'));
assert.ok(issues.some(issue => issue.code === 'PATTERN_SCALE' && issue.captureOwnerId === 'PAINT'));
assert.ok(issues.some(issue => issue.code === 'NONLINEAR_GRADIENT'));
assert.ok(issues.some(issue => issue.code === 'UNKNOWN_GRADIENT_TYPE'));
assert.ok(issues.some(issue => issue.code === 'PATTERN_TRANSFORM'));
assert.ok(issues.some(issue => issue.code === 'BLUR_STACK'));
assert.ok(issues.some(issue => issue.field === 'style.borders.contextSettings.blendMode' && issue.index === 0), '描边混合模式也需要诊断');
assert.ok(issues.some(issue => issue.code === 'NON_NORMAL_BLEND' && issue.captureOwnerId === 'RAW-ROOT' && issue.captureScope === 'composition'));
assert.ok(issues.some(issue => issue.code === 'BLUR_APPROXIMATION' && issue.index === 1 && issue.captureScope === 'composition'));
assert.ok(analysis.issues.some(issue => issue.objectId === 'BOOLEAN' && issue.code === 'BOOLEAN_COMPOSITION'));
assert.strictEqual(JSON.stringify(analyzeRestoreVisuals(raw)), JSON.stringify(analyzeRestoreVisuals(raw)), '诊断顺序应稳定');
const noText = analyzeRestoreVisuals(raw, { includeText: false }).nodesByObjectId.PAINT.raw;
assert.strictEqual(noText.attributedString, undefined);
assert.strictEqual(noText.glyphBounds, undefined);
assert.strictEqual(noText.style.textStyle, undefined);
assert.strictEqual(Object.keys(analyzeRestoreVisuals(undefined).nodesByObjectId).length, 0);
assert.strictEqual(analyzeRestoreVisuals(null).issues.length, 0);
assert.ok(analyzeRestoreVisuals(board([layer('__proto__')])).nodesByObjectId['__proto__']);

// 编译后的公开纯函数在没有 require/Buffer/process 的隔离环境里仍能运行。
const source = fs.readFileSync(path.join(__dirname, '../src/parseRestoreDSL/analyzeRestoreVisuals.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2015 } }).outputText;
const isolated: any = { exports: {} };
vm.runInNewContext(compiled, isolated);
assert.strictEqual(isolated.exports.analyzeRestoreVisuals(copy(raw)).nodesByObjectId.PAINT.raw.frame.x, 10.123456);

// 冻结自修改前0.1.2的完整四入口输出摘要，固定已有公开夹具，不能用新版模拟旧行为。
const oldFixture = JSON.parse(fs.readFileSync(path.join(__dirname, 'test_dsl.json'), 'utf8'));
const legacyCases: Array<[string, (raw: any) => any, string]> = [
    ['measure', picassoArtboardMeatureParse, '064834742294c617ab472b387c4831974c4f4ea7dcba471ebe7f0464add967c0'],
    ['code', picassoArtboardCodeParse, '3a4d04d010d1c24622ece7bad7265211dcedbcc5fc857a24c6fa86ce0df3c786'],
    ['operation', picassoArtboardOperationCodeParse, '2ca1a10875c2db9e4af59cfa9bed5c7193b0fe2efb16a4f06e16b5773287593c'],
    ['lowcode', picassoArtboardLowcodeParse, 'b58df2366ba0f529584bbe9faeee90eeef801be912941e711de45b987d3af1b5'],
];
legacyCases.forEach(([name, parse, expected]) => {
    const out = parse(copy(oldFixture));
    assert.strictEqual(crypto.createHash('sha256').update(JSON.stringify(out)).digest('hex'), expected, name + '老输入完整产物保持一致');
});

/** 使用固定原始ID构造字重回归输入，便于与0.1.2历史指纹精确比较。 */
const weightedBoard = (font: string): any => ({
    _class: 'artboard', do_objectID: 'WEIGHT-ROOT', name: 'weight', isVisible: true,
    frame: { x: 0, y: 0, width: 100, height: 60 }, layers: [{
        _class: 'text', do_objectID: 'WEIGHT-TEXT', name: '字重', isVisible: true,
        frame: { x: 0, y: 0, width: 80, height: 28 },
        attributedString: { string: '字', attributes: [{ location: 0, length: 1, attributes: {
            MSAttributedStringFontAttribute: { attributes: { name: font, size: 20 } },
        } }] },
    }],
});
const weights: Array<[string, number]> = [['Semibold', 600], ['DemiBold', 600], ['Bold', 700], ['ExtraBold', 800], ['HeavyBold', 900], ['Medium', 500]];
weights.forEach(([font, expected]) => {
    const dsl = picassoArtboardRestoreParse(weightedBoard('Fixture-' + font), weightedBoard('Fixture-' + font), undefined, { generatedAt: 'fixed' });
    assert.strictEqual(dsl.artboard.children![0].runs![0].fontWeight, expected, font + '字重');
    assert.strictEqual(dsl.artboard.children![0].id, '55843f59', '同一原始ID的stableId不随字重改变');
    assert.strictEqual(dsl.schemaVersion, '1.1');
    assert.strictEqual(dsl.meta.parserVersion, '0.2.0');
    assert.strictEqual((dsl as any).nodesByObjectId, undefined, '原始事实不能塞进核心schema');
});
const fixedWeight = picassoArtboardRestoreParse(weightedBoard('Fixture-Semibold'), weightedBoard('Fixture-Semibold'), undefined, { generatedAt: 'fixed' });
const corrected = fixedWeight.artboard.children![0];
assert.notStrictEqual(corrected.contentHash, 'b5dc8baa', '600字重修正必须改变旧700语义的contentHash');
assert.notStrictEqual(corrected.styleHash, 'd49d99d0', '600字重修正必须改变旧700语义的styleHash');
assert.notStrictEqual(corrected.subtreeHash, 'd4ee166a');
assert.notStrictEqual(fixedWeight.artboard.subtreeHash, 'c4cfca77', '文本变化应冒泡到根Merkle指纹');
assert.strictEqual(JSON.stringify(fixedWeight), JSON.stringify(picassoArtboardRestoreParse(weightedBoard('Fixture-Semibold'), weightedBoard('Fixture-Semibold'), undefined, { generatedAt: 'fixed' })), '新实现重复运行仍保持稳定');
const fallbackWeight = picassoArtboardRestoreParse(undefined, weightedBoard('Fixture-Semibold'), undefined, { generatedAt: 'fixed' });
assert.notStrictEqual(fallbackWeight.artboard.children![0].id, '5d1eedf6', '缺失A时沿用内容指纹ID，归一化修正会改变fallback ID');
assert.strictEqual(PARSER_VERSION, '0.2.0');
assert.strictEqual(RESTORE_SCHEMA_VERSION, '1.1');

/** 验证生成的CSS/段落HTML语义，不依赖网络或真实字体。 */
const checkRenderer = async (): Promise<void> => {
    const { generateRestoreFragment } = require('../tools/gen_restore_fragment');
    const frame = { x: 0, y: 0, w: 120, h: 90 };
    const node = (id: string, fields: any): any => ({ id, name: id, type: 'rect', frame, absFrame: frame, ...fields });
    const modes = ['fill', 'fit', 'stretch', 'tile'];
    const text = node('paragraphs', { type: 'text', text: '居中\n左侧\n', textResizing: 'auto-width', verticalAlign: 'middle', runs: [
        { from: 0, len: 3, size: 20, fontWeight: 600, color: '#000000', align: 'center', lineHeight: 28 },
        { from: 3, len: 3, size: 16, fontFamily: 'Other', fontWeight: 400, color: '#ff0000', lineHeight: 24 },
    ] });
    const dsl: any = { schemaVersion: '1.1', meta: { assetsScale: 2 }, artboard: node('root', {
        type: 'artboard', fills: [{ color: '#ffffff' }], children: [
            ...modes.map(mode => node(mode, { fills: [{ image: { url: 'data:image/png;base64,AA==', mode } }] })),
            node('multi', { fills: [{ image: { url: 'data:image/png;base64,AA==', mode: 'tile' } }, { image: { url: 'data:image/png;base64,Ag==', mode: 'fit' } }, { color: '#ff000080' }] }),
            node('group-multi', { type: 'group', fills: [{ color: '#000000' }, { color: '#ffffff80' }] }),
            text, node('bottom', { ...text, id: 'bottom', name: 'bottom', verticalAlign: 'bottom' }),
            node('global-align', { ...text, id: 'global-align', name: 'global-align', align: 'right' }),
        ],
    }) };
    const html: string = (await generateRestoreFragment(dsl)).html;
    const styleOf = (id: string): string => {
        const match = html.match(new RegExp('data-dsl-id="' + id + '"[^>]*style="([^"]*)"'));
        assert.ok(match, id + '存在');
        return match![1];
    };
    assert.ok(styleOf('fill').indexOf('background-size: cover') >= 0);
    assert.ok(styleOf('fit').indexOf('background-size: contain') >= 0);
    assert.ok(styleOf('stretch').indexOf('background-size: 100% 100%') >= 0);
    assert.ok(styleOf('tile').indexOf('background-size: auto') >= 0);
    assert.ok(styleOf('tile').indexOf('background-repeat: repeat') >= 0);
    const multi = styleOf('multi');
    assert.ok(multi.indexOf('linear-gradient(#ff000080, #ff000080), url(\'data:image/png;base64,Ag==\'), url(\'data:image/png;base64,AA==\')') >= 0, '保留颜色透明层与反向图片叠层顺序');
    assert.ok(multi.indexOf('background-size: auto, contain, auto') >= 0, '每层保留独立mode');
    assert.ok(multi.indexOf('background-repeat: no-repeat, no-repeat, repeat') >= 0);
    assert.ok(styleOf('group-multi').indexOf('linear-gradient(#ffffff80, #ffffff80), linear-gradient(#000000, #000000)') >= 0);
    assert.ok(styleOf('paragraphs').indexOf('justify-content: center') >= 0, 'middle按整体文本内容居中');
    assert.ok(styleOf('bottom').indexOf('justify-content: flex-end') >= 0);
    assert.ok(styleOf('paragraphs').indexOf('white-space: pre') >= 0);
    assert.ok(styleOf('paragraphs').indexOf('white-space: pre-wrap') < 0, 'auto-width不因文本框高度而软换行');
    assert.ok(html.indexOf('class="txt-paragraph" style="text-align: center;') >= 0);
    assert.ok(html.indexOf('class="txt-paragraph" style="text-align: left;') >= 0, '第二段缺省align恢复left');
    assert.ok(html.indexOf('text-align: center; line-height: 28px; min-height: 28px">居中') >= 0);
    assert.ok(html.indexOf('text-align: left; line-height: 24px; min-height: 24px') >= 0, '各段行高独立，不能被首段strut撑高');
    assert.ok(html.indexOf('text-align: right; line-height: 24px') >= 0, '全段node.align保持权威');
    assert.ok(html.indexOf('font-family: \'Other\'') >= 0);
    assert.ok(html.indexOf('min-height: 24px"></div>') >= 0, '末尾空段继承结束换行所属 run 的行高');
    assert.ok(html.indexOf('width: 120px') >= 0, '不重算原始文本frame');

    // 末尾空段没有字符可命中，必须继承最后分隔符的样式，不能回到第一段。
    for (const separator of ['\n', '\r', '\r\n', '\u2028', '\u2029']) {
        for (const verticalAlign of ['middle', 'bottom']) {
            const trailingText = 'A' + separator + 'B' + separator;
            const lastFrom = 1 + separator.length;
            const trailingNode = node('trailing-empty', {
                type: 'text', text: trailingText, textResizing: 'auto-height', verticalAlign,
                frame: { x: 0, y: 0, w: 120, h: 200 },
                runs: [
                    { from: 0, len: lastFrom, size: 12, fontWeight: 400, align: 'center', lineHeight: 20 },
                    { from: lastFrom, len: trailingText.length - lastFrom, size: 12, fontWeight: 400, align: 'right', lineHeight: 50 },
                ],
            });
            const trailingHtml: string = (await generateRestoreFragment({
                ...dsl, artboard: { ...dsl.artboard, children: [trailingNode] },
            })).html;
            const paragraphStyles = (trailingHtml.match(/class="txt-paragraph" style="[^"]*"/g) || [])
                .map(value => value.replace(/^class="txt-paragraph" style="/, '').replace(/"$/, ''));
            assert.deepStrictEqual(paragraphStyles, [
                'text-align: center; line-height: 20px; min-height: 20px',
                'text-align: right; line-height: 50px; min-height: 50px',
                'text-align: right; line-height: 50px; min-height: 50px',
            ], '混合行高末尾空段继承最后分隔符：' + JSON.stringify({ separator, verticalAlign }));
            assert.ok(trailingHtml.indexOf('justify-content: ' + (verticalAlign === 'middle' ? 'center' : 'flex-end')) >= 0);
        }
    }

    // 第二段改变继承行高后，后续 run 仍须恢复自身行高，包括回退到首 run 行高的情形。
    for (const fixture of [
        { firstHeight: 40, paragraphHeight: 20, explicit: true, verticalAlign: 'middle' },
        { firstHeight: 20, paragraphHeight: 40, explicit: true, verticalAlign: 'bottom' },
        { firstHeight: 40, paragraphHeight: 20, explicit: false, verticalAlign: 'bottom' },
        { firstHeight: 20, paragraphHeight: 40, explicit: false, verticalAlign: 'middle' },
    ]) {
        const mixedText = node('mixed-height', {
            type: 'text', text: 'A\nBC', textResizing: 'auto-height', verticalAlign: fixture.verticalAlign,
            runs: [
                { from: 0, len: 2, size: 16, fontWeight: 400, lineHeight: fixture.firstHeight },
                { from: 2, len: 1, size: 16, fontWeight: 400, lineHeight: fixture.paragraphHeight },
                { from: 3, len: 1, size: 16, fontWeight: 400, ...(fixture.explicit ? { lineHeight: fixture.firstHeight } : {}) },
            ],
        });
        const mixedHtml: string = (await generateRestoreFragment({
            ...dsl, artboard: { ...dsl.artboard, children: [mixedText] },
        })).html;
        assert.ok(mixedHtml.indexOf('line-height: ' + fixture.paragraphHeight + 'px; min-height: '
            + fixture.paragraphHeight + 'px">B<span style="line-height: ' + fixture.firstHeight + 'px">C</span></div>') >= 0,
            '第二段首字符继承段落行高，后续字符保留' + (fixture.explicit ? '显式' : '回退') + '行高：' + JSON.stringify(fixture));
        assert.ok(mixedHtml.indexOf('justify-content: ' + (fixture.verticalAlign === 'middle' ? 'center' : 'flex-end')) >= 0,
            '混合行高仍对整体文本内容执行垂直对齐');
    }
};
checkRenderer().then(() => console.log('visual-analysis: API, JSC isolation, frozen legacy outputs, hashes and renderer checks passed')).catch(error => {
    console.error(error);
    process.exitCode = 1;
});
