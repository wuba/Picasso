/**
 * RestoreDSL 归一化之前的原始事实与保真诊断。
 * 本模块只读 Sketch JSON，不依赖 Node/Sketch API，也不向核心 DSL 注入字段。
 */
import { SKLayer } from '../types';

/** 原始事实采集选项；不影响解析、指纹或视觉节点的启用状态。 */
export interface RestoreVisualAnalysisOptions {
    /** 是否保留文本、段落和字体原值，默认 true；关闭时仍采集图形事实。 */
    includeText?: boolean;
}

/** 单节点原始事实，所有 raw 值都是独立副本，单位和枚举保持 Sketch 原样。 */
export interface RestoreRawVisualFacts {
    /** 展开树中的 do_objectID，供插件关联仍存活的原生图层。 */
    objectId: string;
    /** 直属父层 do_objectID；根节点缺省。 */
    parentObjectId?: string;
    /** 已执行 annotateStableIds 时保留真实 stableId，不伪造 ID。 */
    stableId?: string;
    /** 未裁剪、未归一化的视觉字段；缺失字段不补默认值。 */
    raw: { [field: string]: any };
    /** 在当前同级作用域中生效的蒙版来源 ID；只描述关系，不模拟像素合成。 */
    maskChain?: string[];
}

/** 稳定原因码；只描述当前表示能力，不作为上传或还原的拒绝条件。 */
export type RestoreVisualIssueCode = 'UNSUPPORTED_FILL' | 'NONLINEAR_GRADIENT'
    | 'UNKNOWN_GRADIENT_TYPE' | 'PATTERN_SCALE' | 'PATTERN_TRANSFORM'
    | 'NON_NORMAL_BLEND' | 'MASK_CHAIN' | 'BOOLEAN_COMPOSITION'
    | 'BLUR_STACK' | 'BLUR_APPROXIMATION';

/** 可降级问题及建议补拍范围；诊断完整不代表视觉验收通过。 */
export interface RestoreVisualIssue {
    /** 原始展开树 do_objectID，与 nodesByObjectId 对应。 */
    objectId: string;
    /** 已有 stableId 时提供，未注入时省略，插件可在配对后补充。 */
    dslId?: string;
    /** 资源或合成角色，用于向用户说明局部限制。 */
    role: 'fill' | 'gradient' | 'image' | 'blend' | 'mask' | 'boolean' | 'blur';
    /** 可机器识别、与文案分离的原因。 */
    code: RestoreVisualIssueCode;
    /** 原始字段路径，便于追溯未经归一化的证据。 */
    field?: string;
    /** fills/blurs 等原始数组下标；数组过滤前的索引。 */
    index?: number;
    /** 建议补拍的原生图层 ID，不保证单层透明导出即可重现背景合成。 */
    captureOwnerId: string;
    /** composition 表示须保留蒙版、背景或兄弟层等合成上下文。 */
    captureScope: 'layer' | 'composition';
}

/** 与核心 RestoreDSL 分离的报告，允许插件独立保存或通过可选能力传递。 */
export interface RestoreVisualAnalysis {
    /** 报告结构版本，与插件版本及 RestoreDSL schemaVersion 无关。 */
    reportVersion: 1;
    /** 按展开树 do_objectID 索引的事实，不包含归一化后的近似值。 */
    nodesByObjectId: { [objectId: string]: RestoreRawVisualFacts };
    /** 按原始树前序和字段顺序输出的稳定诊断，可用于补拍调度。 */
    issues: RestoreVisualIssue[];
}

/** 保留这些原始键；完整 style 包含填充、混合、渐变、效果栈与文本样式。 */
const RAW_VISUAL_FIELDS = [
    '_class', 'name', 'frame', 'isVisible', 'rotation', 'isFlippedHorizontal',
    'isFlippedVertical', 'transform', 'transformationMatrix', 'image', 'points',
    'isClosed', 'booleanOperation', 'hasClippingMask', 'clippingMaskMode',
    'shouldBreakMaskChain', 'clipsContents', 'clippingBehavior', 'style',
    'hasBackgroundColor', 'backgroundColor', 'includeBackgroundColorInExport',
];

/** 文本字段保留原值，包括无法仅凭字符串重算的 glyphBounds。 */
const RAW_TEXT_FIELDS = [
    'attributedString', 'textBehaviour', 'verticalAlignment', 'glyphBounds',
    'textStyle', 'font', 'fontDescriptor', 'lineSpacingBehaviour',
];

/** 图片填充的附加变换字段；遇到时保留原始值并建议原生补拍，不猜内部矩阵单位。 */
const PATTERN_TRANSFORM_FIELDS = ['patternTransform', 'imageTransform', 'transform', 'transformationMatrix'];

/**
 * 克隆 JSON 值而不调用序列化钩子，不依赖 structuredClone 或 Node API。
 * @param value Sketch JSON 中的普通值；输入应为无环的 JSON 树。
 * @returns 与输入引用隔离的值，保留原始数值精度与数组顺序。
 */
const copyRaw = (value: any): any => {
    if (Array.isArray(value)) return value.map(copyRaw);
    if (value && typeof value === 'object') {
        const result: { [key: string]: any } = Object.create(null);
        Object.keys(value).forEach(key => { result[key] = copyRaw(value[key]); });
        return result;
    }
    return value;
};

/**
 * 在 trim/map/bake 之前读取原始设计信息；不修改输入、不注入 stableId 或指纹。
 * 蒙版和非普通混合建议使用直属父级作为最小已知合成容器，插件仍须根据真实导出
 * 结果选择更完整的范围；采集或补拍失败时可继续使用结构与设计原图修复。
 * @param exportB 解绑副本的原始 Sketch JSON，必须在裁剪或切图整形之前调用。
 * @param options 原始文本采集选项。
 * @returns 独立诊断及原始事实；空输入返回空报告，不增加流程门槛。
 */
export const analyzeRestoreVisuals = (
    exportB: SKLayer | undefined | null,
    options: RestoreVisualAnalysisOptions = {},
): RestoreVisualAnalysis => {
    const result: RestoreVisualAnalysis = { reportVersion: 1, nodesByObjectId: Object.create(null), issues: [] };
    const includeText = options.includeText !== false;

    /** 记录一个节点诊断；ID 缺失的非标准节点不生成虚构的原生引用。 */
    const addIssue = (
        layer: any, parentId: string | undefined, role: RestoreVisualIssue['role'],
        code: RestoreVisualIssueCode, field?: string, index?: number, composition: boolean = false,
    ): void => {
        if (typeof layer.do_objectID !== 'string' || !layer.do_objectID) return;
        const issue: RestoreVisualIssue = {
            objectId: layer.do_objectID, role, code,
            captureOwnerId: composition && parentId ? parentId : layer.do_objectID,
            captureScope: composition ? 'composition' : 'layer',
        };
        if (typeof layer.stableId === 'string' && layer.stableId) issue.dslId = layer.stableId;
        if (field !== undefined) issue.field = field;
        if (index !== undefined) issue.index = index;
        result.issues.push(issue);
    };

    /** 按原始树顺序采集节点及兄弟蒙版关系，既不裁剪 frame，也不剔除隐藏节点。 */
    const visit = (layers: any[], parentId?: string, inheritedMasks: string[] = []): void => {
        let activeMasks = inheritedMasks.slice();
        layers.forEach(layer => {
            if (!layer || typeof layer !== 'object') return;
            if (layer.shouldBreakMaskChain) activeMasks = inheritedMasks.slice();
            const objectId = typeof layer.do_objectID === 'string' ? layer.do_objectID : '';
            if (objectId) {
                const facts: RestoreRawVisualFacts = { objectId, raw: Object.create(null) };
                if (parentId) facts.parentObjectId = parentId;
                if (typeof layer.stableId === 'string' && layer.stableId) facts.stableId = layer.stableId;
                const fields = includeText ? RAW_VISUAL_FIELDS.concat(RAW_TEXT_FIELDS) : RAW_VISUAL_FIELDS;
                fields.forEach(field => {
                    if (Object.prototype.hasOwnProperty.call(layer, field)) facts.raw[field] = copyRaw(layer[field]);
                });
                if (!includeText && facts.raw.style) {
                    delete facts.raw.style.textStyle;
                    delete facts.raw.style.encodedAttributes;
                }
                if (activeMasks.length) facts.maskChain = activeMasks.slice();
                result.nodesByObjectId[objectId] = facts;
            }
            const style = layer.style || {};
            const context = style.contextSettings || {};
            if (context.blendMode !== undefined && context.blendMode !== 0) {
                addIssue(layer, parentId, 'blend', 'NON_NORMAL_BLEND', 'style.contextSettings.blendMode', undefined, true);
            }
            if (layer.hasClippingMask || activeMasks.length) {
                // 外部蒙版可能来自祖先的兄弟层，直属父级不一定包含它；保留最外层蒙版的作用域。
                const outerMask = activeMasks.length ? result.nodesByObjectId[activeMasks[0]] : undefined;
                const maskOwnerId = outerMask && outerMask.parentObjectId ? outerMask.parentObjectId : parentId;
                addIssue(layer, maskOwnerId, 'mask', 'MASK_CHAIN', 'hasClippingMask', undefined, true);
            }
            if (layer._class === 'shapeGroup') {
                addIssue(layer, parentId, 'boolean', 'BOOLEAN_COMPOSITION', 'booleanOperation');
            }
            const fills = Array.isArray(style.fills) ? style.fills : [];
            fills.forEach((fill: any, index: number) => {
                if (!fill || !(fill.isEnabled || fill.enabled)) return;
                if ([0, 1, 4].indexOf(fill.fillType) < 0) {
                    addIssue(layer, parentId, 'fill', 'UNSUPPORTED_FILL', 'style.fills', index);
                }
                if (fill.contextSettings && fill.contextSettings.blendMode !== undefined && fill.contextSettings.blendMode !== 0) {
                    addIssue(layer, parentId, 'blend', 'NON_NORMAL_BLEND', 'style.fills.contextSettings.blendMode', index, true);
                }
                if (fill.fillType === 1 && fill.gradient) {
                    const type = fill.gradient.gradientType;
                    if (type === 1 || type === 2) {
                        addIssue(layer, parentId, 'gradient', 'NONLINEAR_GRADIENT', 'style.fills.gradient', index);
                    } else if (type !== undefined && type !== 0) {
                        addIssue(layer, parentId, 'gradient', 'UNKNOWN_GRADIENT_TYPE', 'style.fills.gradient.gradientType', index);
                    }
                }
                if (fill.fillType === 4) {
                    if (typeof fill.patternTileScale === 'number' && fill.patternTileScale !== 1) {
                        addIssue(layer, parentId, 'image', 'PATTERN_SCALE', 'style.fills.patternTileScale', index);
                    }
                    PATTERN_TRANSFORM_FIELDS.forEach(field => {
                        if (fill[field] !== undefined && fill[field] !== null) {
                            addIssue(layer, parentId, 'image', 'PATTERN_TRANSFORM', 'style.fills.' + field, index);
                        }
                    });
                }
            });
            // 描边及阴影也能携带自己的混合模式，raw 保留原值，诊断不能只检查 fills。
            ['borders', 'shadows', 'innerShadows'].forEach(field => {
                const effects = Array.isArray(style[field]) ? style[field] : [];
                effects.forEach((effect: any, index: number) => {
                    if (!effect || !(effect.isEnabled || effect.enabled)) return;
                    const blend = effect.contextSettings && effect.contextSettings.blendMode;
                    if (blend !== undefined && blend !== 0) {
                        addIssue(layer, parentId, 'blend', 'NON_NORMAL_BLEND', 'style.' + field + '.contextSettings.blendMode', index, true);
                    }
                });
            });
            const blurs: any[] = Array.isArray(style.blurs) ? style.blurs : style.blur ? [style.blur] : [];
            const enabledBlurs = blurs.filter(blur => blur && blur.isEnabled);
            if (enabledBlurs.length > 1) addIssue(layer, parentId, 'blur', 'BLUR_STACK', 'style.blurs');
            blurs.forEach((blur: any, index: number) => {
                if (blur && blur.isEnabled && blur.type !== 0) {
                    addIssue(layer, parentId, 'blur', 'BLUR_APPROXIMATION', Array.isArray(style.blurs) ? 'style.blurs' : 'style.blur', index, blur.type === 3);
                }
            });
            if (Array.isArray(layer.layers)) visit(layer.layers, objectId || parentId, activeMasks);
            // 蒙版从其后面的兄弟节点开始生效；自身子树仍只继承外部蒙版。
            if (layer.hasClippingMask && objectId) activeMasks = activeMasks.concat(objectId);
        });
    };
    if (exportB && typeof exportB === 'object') visit([exportB]);
    return result;
};
