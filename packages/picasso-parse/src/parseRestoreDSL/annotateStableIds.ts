/**
 * 稳定 ID 注入。
 *
 * 三导出管线：
 * - 导出 A：原始画板 JSON（do_objectID 持久稳定；symbolInstance 为叶子，带 symbolID + overrides）
 * - 导出 B：解绑副本 JSON（几何精确的展开树，但 do_objectID 每次上传都变）
 * - 导出 C：画板引用到的 symbolMaster 定义树（master 图层 ID 同样稳定）
 *
 * A 与 B 在解绑点之前树结构完全同构：平行前序遍历建立 B→A 映射，把
 * stableId / contentHash / subtreeHash 注入 B 树本身（原地修改并返回）。
 * A 中 symbolInstance（叶子）对应 B 中展开 group（子树）处进入复合 ID 模式：
 * `实例短id/master图层短id`（嵌套实例继续链式追加），与 Sketch override path 格式同构。
 *
 * 结构不同构的兜底：子节点数不一致时按 name+_class 顺序贪心配对，
 * 配不上的 B 节点不写 stableId（内容指纹 contentHash/subtreeHash 仍然注入），绝不抛错中断上传。
 *
 * 同时注入 restoreComponentKey / restoreOverrides（RestoreDSL 组装 Symbol 信息用；
 * 对四种存量 DSL 是多余字段，parseDSL 按白名单建节点不会带出）。
 */
import { SKLayer } from '../types';
import { createShortHashContext, shortHashOf, annotateHashes, ShortHashContext } from './hash';

type AnnotateContext = {
    hash: ShortHashContext;
    // symbolID → master 定义树（导出 C）
    masterBySymbolID: { [symbolID: string]: SKLayer };
    // 原稿 UUID → 图层名（override path 可读化）
    nameByUUID: { [uuid: string]: string };
};

const collectNames = (layer: SKLayer, ctx: AnnotateContext): void => {
    if (layer.do_objectID) ctx.nameByUUID[layer.do_objectID] = layer.name;
    if (Array.isArray(layer.layers)) {
        layer.layers.forEach(child => collectNames(child, ctx));
    }
};

/** 类兼容：同类，或「A 侧实例 ↔ B 侧解绑后的组」 */
const isCompatible = (aClass: string, bClass: string): boolean => {
    if (aClass === bClass) return true;
    return aClass === 'symbolInstance' && bClass === 'group';
};

/**
 * 子节点配对：数量一致按 index 硬配（快路径，覆盖绝大多数画板）；
 * 不一致时按 (name, class 兼容) 做保持顺序的贪心匹配。
 */
const pairChildren = (aChildren: SKLayer[], bChildren: SKLayer[]): (SKLayer | undefined)[] => {
    if (aChildren.length === bChildren.length) {
        return bChildren.map((_b, i) => aChildren[i]);
    }
    const paired: (SKLayer | undefined)[] = [];
    let cursor = 0;
    bChildren.forEach((b) => {
        let match: SKLayer | undefined;
        for (let i = cursor; i < aChildren.length; i++) {
            if (aChildren[i].name === b.name && isCompatible(aChildren[i]._class, b._class)) {
                match = aChildren[i];
                cursor = i + 1;
                break;
            }
        }
        paired.push(match);
    });
    return paired;
};

/** 解析 A 侧 symbolInstance 的 overrideValues → 可读键 overrides */
const resolveOverrides = (aInstance: any, ctx: AnnotateContext): { [key: string]: any } | undefined => {
    const overrideValues: any[] = aInstance && Array.isArray(aInstance.overrideValues) ? aInstance.overrideValues : [];
    if (!overrideValues.length) return undefined;
    const overrides: { [key: string]: any } = {};
    overrideValues.forEach((ov: any) => {
        if (!ov || typeof ov.overrideName !== 'string') return;
        const m = ov.overrideName.match(/^(.+)_(stringValue|symbolID|image)$/);
        if (!m) return; // textStyle / layerStyle 等样式类 override 不属于内容信息，跳过
        const readable = m[1]
            .split('/')
            .map((uuid: string) => ctx.nameByUUID[uuid] || uuid.slice(0, 8))
            .join('/');
        let value: any = ov.value;
        if (m[2] === 'image' && value && typeof value === 'object') {
            value = value._ref || value;
        }
        if (m[2] === 'symbolID' && typeof value === 'string' && value) {
            value = shortHashOf(value, ctx.hash);
        }
        if (value === '' || value === undefined || value === null) return;
        overrides[readable] = value;
    });
    if (!Object.keys(overrides).length) return undefined;
    return overrides;
};

/**
 * A/B 平行前序遍历。
 * @param aNode A 侧节点（原稿树或复合模式下的 master 定义树节点）
 * @param bNode B 侧节点（解绑展开树）
 * @param prefix 复合 ID 前缀（顶层为空串）
 */
const pairWalk = (aNode: SKLayer, bNode: SKLayer, prefix: string, ctx: AnnotateContext): void => {
    const ownShort = shortHashOf(aNode.do_objectID, ctx.hash);
    const stableId = prefix ? `${prefix}/${ownShort}` : ownShort;
    (bNode as any).stableId = stableId;

    // 解绑点：A 实例（叶子）↔ B 展开组（子树），进入复合 ID 模式
    if (aNode._class === 'symbolInstance') {
        const symbolID: string = (aNode as any).symbolID;
        if (symbolID) {
            (bNode as any).restoreComponentKey = shortHashOf(symbolID, ctx.hash);
        }
        const overrides = resolveOverrides(aNode, ctx);
        if (overrides) (bNode as any).restoreOverrides = overrides;

        if (bNode._class === 'group') {
            const master = symbolID ? ctx.masterBySymbolID[symbolID] : undefined;
            if (master && Array.isArray(master.layers) && Array.isArray(bNode.layers)) {
                // 复合模式：A 侧换成 master 定义树，前缀 = 实例路径
                const paired = pairChildren(master.layers, bNode.layers);
                bNode.layers.forEach((bChild, i) => {
                    const aChild = paired[i];
                    if (aChild) pairWalk(aChild, bChild, stableId, ctx);
                });
            }
            // master 缺失（Library 外部库 / 降级）：展开树子节点无 stableId，仅内容指纹兜底
        }
        return;
    }

    const aChildren = Array.isArray(aNode.layers) ? aNode.layers : [];
    const bChildren = Array.isArray(bNode.layers) ? bNode.layers : [];
    if (!bChildren.length) return;
    const paired = pairChildren(aChildren, bChildren);
    bChildren.forEach((bChild, i) => {
        const aChild = paired[i];
        if (aChild) pairWalk(aChild, bChild, prefix, ctx);
    });
};

/** master 定义树自注入：stableId = 自身 do_objectID 短哈希（原文档导出，天然稳定） */
const annotateMasterTree = (layer: SKLayer, ctx: AnnotateContext): void => {
    (layer as any).stableId = shortHashOf(layer.do_objectID, ctx.hash);
    if (Array.isArray(layer.layers)) {
        layer.layers.forEach(child => annotateMasterTree(child, ctx));
    }
};

/**
 * 给 B 树每个节点注入 stableId / contentHash / subtreeHash（原地修改，返回同一对象）。
 * 插件端调用顺序：三导出 → annotateStableIds → 四种 DSL + RestoreDSL 吃同一棵注入后的树。
 *
 * @param exportB 解绑副本画板 JSON（导出 B，将被原地注入）
 * @param exportA 原始画板 JSON（导出 A；缺省时退化为「仅内容指纹」模式，stableId 不注入）
 * @param mastersC 画板引用到的 symbolMaster JSON 列表（导出 C；缺省时复合 ID 与 overrides 可读化降级）
 */
export const annotateStableIds = (exportB: SKLayer, exportA?: SKLayer, mastersC?: SKLayer[]): SKLayer => {
    const ctx: AnnotateContext = {
        hash: createShortHashContext(),
        masterBySymbolID: {},
        nameByUUID: {},
    };

    if (Array.isArray(mastersC)) {
        mastersC.forEach((master: any) => {
            if (master && master.symbolID) {
                ctx.masterBySymbolID[master.symbolID] = master;
            }
            if (master) collectNames(master, ctx);
        });
    }
    if (exportA) collectNames(exportA, ctx);

    if (exportA) {
        pairWalk(exportA, exportB, '', ctx);
    }

    // master 定义树也注入稳定 ID + 内容指纹（components[*].tree 消费）
    if (Array.isArray(mastersC)) {
        mastersC.forEach((master) => {
            if (!master) return;
            if ((master as any).symbolID) {
                // components 字典 key（与实例节点上注入的 restoreComponentKey 同一 ctx，保证一致）
                (master as any).restoreComponentKey = shortHashOf((master as any).symbolID, ctx.hash);
            }
            annotateMasterTree(master, ctx);
            annotateHashes(master);
        });
    }

    // 内容指纹与映射无关，整树后序注入（A 缺失时仍可用作 diff 兜底）
    annotateHashes(exportB);

    return exportB;
};

export default annotateStableIds;
