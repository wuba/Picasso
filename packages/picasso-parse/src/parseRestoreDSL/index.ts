/**
 * RestoreDSL 解析入口。
 *
 * 与现有四种 DSL 不同：结构保真（1:1 镜像 Sketch 图层树）、值归一化（Sketch 私有编码 →
 * Web 通用值）、无布局推断——不接 picassoGroup / picassoLayout / handleClassName。
 * 复用 parseArtboard/ 的坐标绝对化、Mask 几何化、隐藏层剔除。
 */
import { SKLayer } from '../types';
import formatCoordinate from '../parseArtboard/formatCoordinate';
import fixPosition from '../parseArtboard/fixPosition';
import trimByMask from '../parseArtboard/trimByMask';
import filterHideLayer from '../parseArtboard/filterHideLayer';
import annotateStableIds from './annotateStableIds';
import mapNode from './mapNode';
import aggregateDesignTokens from './designTokens';
import { textStyleKey } from './normalize';
import {
    RestoreDSL,
    RestoreMetaOptions,
    RestoreComponentDef,
    RestoreDesignTokens,
    RestoreNode,
    RESTORE_SCHEMA_VERSION,
    PARSER_VERSION,
} from './restoreTypes';

export { annotateStableIds };
export * from './restoreTypes';
export { assessRestoreDiffability } from './diffability';
export type { DiffabilityReport, DiffabilityVerdict } from './diffability';
export { toRenderProfile } from './renderProfile';

const deepCopy = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

/** 复用既有画板预处理：坐标绝对化 → 基准归零 → Mask 几何化 → 隐藏层剔除（输入深拷贝，不动原树） */
const prepareTree = (root: SKLayer): SKLayer | undefined => {
    let layers: SKLayer[] = [deepCopy(root)];
    layers = formatCoordinate(layers as any) as SKLayer[];
    layers = fixPosition(layers);
    layers = trimByMask(layers);
    layers = filterHideLayer(layers);
    return layers[0];
};

/** 节点 → designTokens 反向关联：fills[].token / runs[].styleToken（值与 token 命中时写入） */
const linkTokens = (root: RestoreNode, tokens: RestoreDesignTokens): void => {
    const colorTokenByValue: { [hex: string]: string } = {};
    if (tokens.colors) {
        Object.keys(tokens.colors).forEach((name) => {
            colorTokenByValue[tokens.colors![name].value] = name;
        });
    }
    const styleTokenByKey: { [key: string]: string } = {};
    if (tokens.textStyles) {
        Object.keys(tokens.textStyles).forEach((name) => {
            const entry = tokens.textStyles![name];
            styleTokenByKey[textStyleKey(entry)] = name;
        });
    }

    const walk = (node: RestoreNode): void => {
        (node.fills || []).forEach((fill) => {
            if (fill.color && colorTokenByValue[fill.color]) {
                fill.token = colorTokenByValue[fill.color];
            }
        });
        (node.runs || []).forEach((run) => {
            const key = textStyleKey(run);
            if (styleTokenByKey[key]) {
                run.styleToken = styleTokenByKey[key];
            }
        });
        (node.children || []).forEach(walk);
    };
    walk(root);
};

export type RestoreParseOptions = RestoreMetaOptions & {
    // symbolID → 来源标记（'local' | 'library:<库名>'），插件端可得、包内不可得，透传字段
    componentSources?: { [symbolID: string]: string };
};

/**
 * Picasso 画板 RestoreDSL 解析方法（三份输入合并：ID 回填 + components 组装 + overrides 解析）。
 *
 * 注意：签名与现有四个 picassoArtboard*Parse 不同（多输入）。
 * exportB / mastersC 若未经 annotateStableIds 注入，本函数会先原地注入（幂等）；
 * 插件端推荐调用顺序：三导出 → annotateStableIds → 四种 DSL + RestoreDSL 吃同一棵注入后的树。
 *
 * @param exportA 原始画板 JSON（导出 A，稳定 do_objectID）；可缺省（stableId 降级为内容指纹）
 * @param exportB 解绑副本画板 JSON（导出 B，几何精确的展开树）
 * @param mastersC 画板引用到的 symbolMaster JSON 列表（导出 C）；可缺省（components 降级）
 * @param options meta 信息（sketchVersion / pluginVersion / documentId / generatedAt / componentsOmitted）
 */
export const picassoArtboardRestoreParse = (
    exportA: SKLayer | undefined,
    exportB: SKLayer,
    mastersC?: SKLayer[],
    options?: RestoreParseOptions,
): RestoreDSL => {
    const opts = options || {};

    // 幂等注入：已注入则跳过，保证与四种存量 DSL 消费同一批 stableId/hash。
    // 只查 B 根 contentHash 不够——若调用方复用已注入的 B 树但传入了新的（未注入）mastersC，
    // 新 masters 缺 restoreComponentKey 会被下方 components 组装静默整体丢弃，故一并校验
    const mastersAnnotated = !Array.isArray(mastersC)
        || mastersC.every((master: any) => !master || !master.symbolID || !!master.restoreComponentKey);
    if (!(exportB as any).contentHash || !mastersAnnotated) {
        annotateStableIds(exportB, exportA, mastersC);
    }

    // —— artboard 主树 ——
    const prepared = prepareTree(exportB);
    if (!prepared) {
        throw new Error('[picassoArtboardRestoreParse] 画板预处理后为空树');
    }
    const artboard = mapNode(prepared, null);

    // —— components 字典（symbolMaster 定义树） ——
    const components: { [key: string]: RestoreComponentDef } = {};
    const tokenSourceTrees: SKLayer[] = [prepared];
    const componentTrees: RestoreNode[] = [];
    if (Array.isArray(mastersC)) {
        mastersC.forEach((master: any) => {
            if (!master || !master.symbolID || !master.restoreComponentKey) return;
            const def: RestoreComponentDef = {
                name: master.name,
                symbolID: master.symbolID,
                source: (opts.componentSources && opts.componentSources[master.symbolID]) || 'local',
            };
            const preparedMaster = prepareTree(master);
            if (preparedMaster) {
                def.tree = mapNode(preparedMaster, null);
                tokenSourceTrees.push(preparedMaster);
                componentTrees.push(def.tree);
            }
            components[master.restoreComponentKey] = def;
        });
    }

    // —— designTokens（画板 + 组件定义树统一聚合，再对两侧回写节点级反向关联，
    //    保证同一 hex/文本样式在 artboard 树与 components[*].tree 中 token 归属一致） ——
    const designTokens = aggregateDesignTokens(tokenSourceTrees);
    linkTokens(artboard, designTokens);
    componentTrees.forEach(tree => linkTokens(tree, designTokens));

    // —— meta ——
    const meta: RestoreDSL['meta'] = {
        parserVersion: PARSER_VERSION,
        units: 'pt',
    };
    if (opts.sketchVersion) meta.sketchVersion = opts.sketchVersion;
    if (opts.pluginVersion) meta.pluginVersion = opts.pluginVersion;
    if (opts.documentId) meta.documentId = opts.documentId;
    if (opts.generatedAt) meta.generatedAt = opts.generatedAt;
    if (opts.componentsOmitted) meta.componentsOmitted = true;
    if (opts.assetsBaseUrl) meta.assetsBaseUrl = opts.assetsBaseUrl;

    return {
        schemaVersion: RESTORE_SCHEMA_VERSION,
        meta,
        designTokens,
        components,
        artboard,
    };
};

export default picassoArtboardRestoreParse;
