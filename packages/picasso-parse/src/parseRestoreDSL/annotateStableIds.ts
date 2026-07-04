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
 * 结构不同构的兜底：子节点数不一致（或逐位 name/_class 对不齐）时按 name+_class 顺序贪心配对，
 * 配不上的 B 节点不写 stableId（内容指纹 contentHash/subtreeHash 仍然注入），绝不抛错中断上传；
 * 配对失败会累计进统计并挂到 exportB.restorePairingStats（条件写入），供插件端观测告警。
 *
 * 同时注入 restoreComponentKey / restoreOverrides（RestoreDSL 组装 Symbol 信息用；
 * 对四种存量 DSL 是多余字段，parseDSL 按白名单建节点不会带出）。
 */
import { SKLayer } from '../types';
import { createShortHashContext, shortHashOf, annotateHashes, contentHashOf, ShortHashContext } from './hash';

export type PairingStats = {
    // B 侧配不上 A 侧的节点数（其整棵子树无 stableId，仅内容指纹兜底；不含被跳过的后代）
    unpaired: number;
    // 前 N 个配对失败节点的路径（stableId 前缀/图层名），定位用
    unpairedPaths: string[];
};

const UNPAIRED_PATH_LIMIT = 50;

type AnnotateContext = {
    hash: ShortHashContext;
    // symbolID → master 定义树（导出 C）
    masterBySymbolID: { [symbolID: string]: SKLayer };
    // 原稿 UUID → 图层名（override path 可读化）
    nameByUUID: { [uuid: string]: string };
    // 配对失败是静默降级，必须留观测口：注入结束后条件挂到 exportB.restorePairingStats
    stats: PairingStats;
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
 * frame 几何一致（±0.5pt）。跨类配对（A 实例 ↔ B 解绑组）时 contentHash 结构性不可比
 * （两侧 _class/子树形态不同，同一实例的 hash 也不同），而解绑是原位替换、保持 frame——
 * 几何是该场景下唯一可用的换序判据。缺 frame 信息时返回 true（不据此否决）。
 */
const framesEqual = (a: SKLayer, b: SKLayer): boolean => {
    const fa: any = (a as any).frame;
    const fb: any = (b as any).frame;
    if (!fa || !fb) return true;
    return Math.abs(fa.x - fb.x) <= 0.5 && Math.abs(fa.y - fb.y) <= 0.5
        && Math.abs(fa.width - fb.width) <= 0.5 && Math.abs(fa.height - fb.height) <= 0.5;
};

/**
 * 子节点配对：数量一致且逐位 name/_class 兼容时按 index 硬配（快路径，覆盖绝大多数画板）；
 * 否则先按 (name, contentHash 全等) 配——内容跟人走，同名兄弟 z 序调换也不会错位注入
 * （靠 annotateStableIds 里 hash 先于配对注入保证 A/B 两侧 contentHash 可用）；
 * 剩余节点再按 (name, class 兼容) 做保持顺序的贪心兜底（override 改过内容的节点 hash
 * 已不同，按 name 保序配是对的）。
 * index 硬配前必须逐位校验——复合模式下 A 侧是 master 定义树、B 侧是实例化解绑组，
 * 两者来源不同（override 换组件可能改变子节点），盲配会给不相关节点注入错误 stableId。
 */
const pairChildren = (aChildren: SKLayer[], bChildren: SKLayer[]): (SKLayer | undefined)[] => {
    if (aChildren.length === bChildren.length) {
        // 同名兄弟的重名计数：重名时 index 硬配前必须复验，否则 z 序调换会错位注入。
        // 同 class：两侧 hash 均在但不等 → 疑似换序；跨类（实例↔解绑组）hash 不可比
        //（守卫若写成 a._class === b._class 会在解绑场景——唯一允许跨类配对的场景——
        // 系统性跳过复验），改比 frame 几何（解绑原位替换保持 frame）。
        // 名字唯一时 hash/frame 不等只是内容被改，index 硬配仍正确（内容跟人走）
        const nameCount: { [name: string]: number } = {};
        aChildren.forEach((a) => { nameCount[a.name] = (nameCount[a.name] || 0) + 1; });
        const indexAligned = bChildren.every((b, i) => {
            const a = aChildren[i];
            if (a.name !== b.name || !isCompatible(a._class, b._class)) return false;
            if (nameCount[a.name] > 1) {
                if (a._class === b._class) {
                    // A 侧用只读计算（不污染输入树），B 侧读已注入值
                    const bHash = (b as any).contentHash;
                    if (bHash && contentHashOf(a) !== bHash) return false;
                } else if (!framesEqual(a, b)) {
                    return false;
                }
            }
            return true;
        });
        if (indexAligned) {
            return bChildren.map((_b, i) => aChildren[i]);
        }
    }
    const paired: (SKLayer | undefined)[] = new Array(bChildren.length);
    const aTaken: boolean[] = new Array(aChildren.length);

    // 第一轮：name + contentHash 全等——跨顺序找正主（z 序调换场景），故从头扫描不保序；
    // 同名同 hash 多胞胎（视觉等价节点）靠 aTaken 按出现顺序领取
    bChildren.forEach((b, bi) => {
        const bHash = (b as any).contentHash;
        if (!bHash) return;
        for (let i = 0; i < aChildren.length; i++) {
            if (aTaken[i]) continue;
            if (aChildren[i].name === b.name
                && contentHashOf(aChildren[i]) === bHash
                && isCompatible(aChildren[i]._class, b._class)) {
                paired[bi] = aChildren[i];
                aTaken[i] = true;
                break;
            }
        }
    });

    // 第 1.5 轮：跨类（实例↔解绑组）hash 不可比，按 (name, 跨类兼容, frame 几何一致)
    // 跨顺序找正主——同名实例 z 序调换时靠 frame 找回，防止落进下方保序贪心轮错配
    bChildren.forEach((b, bi) => {
        if (paired[bi]) return;
        for (let i = 0; i < aChildren.length; i++) {
            if (aTaken[i]) continue;
            if (aChildren[i].name === b.name
                && aChildren[i]._class !== b._class
                && isCompatible(aChildren[i]._class, b._class)
                && framesEqual(aChildren[i], b)) {
                paired[bi] = aChildren[i];
                aTaken[i] = true;
                break;
            }
        }
    });

    // 第二轮：剩余（内容被改、无 hash 线索的节点）按 (name, class 兼容) 从头扫描贪心——
    // aTaken 保证不重复领取；同名者按两侧出现顺序对位（无证据时假定顺序未变）
    bChildren.forEach((b, bi) => {
        if (paired[bi]) return;
        for (let i = 0; i < aChildren.length; i++) {
            if (aTaken[i]) continue;
            if (aChildren[i].name === b.name && isCompatible(aChildren[i]._class, b._class)) {
                paired[bi] = aChildren[i];
                aTaken[i] = true;
                break;
            }
        }
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
                pairAndWalk(master.layers, bNode.layers, stableId, ctx);
            }
            // master 缺失（Library 外部库 / 降级）：展开树子节点无 stableId，仅内容指纹兜底
        }
        return;
    }

    const aChildren = Array.isArray(aNode.layers) ? aNode.layers : [];
    const bChildren = Array.isArray(bNode.layers) ? bNode.layers : [];
    if (!bChildren.length) return;
    pairAndWalk(aChildren, bChildren, prefix, ctx);
};

/** 配对 + 递归下钻；配不上的 B 节点计入 ctx.stats（其整棵子树无 stableId，仅内容指纹兜底） */
const pairAndWalk = (aChildren: SKLayer[], bChildren: SKLayer[], prefix: string, ctx: AnnotateContext): void => {
    const paired = pairChildren(aChildren, bChildren);
    bChildren.forEach((bChild, i) => {
        const aChild = paired[i];
        if (aChild) {
            pairWalk(aChild, bChild, prefix, ctx);
        } else {
            ctx.stats.unpaired++;
            if (ctx.stats.unpairedPaths.length < UNPAIRED_PATH_LIMIT) {
                ctx.stats.unpairedPaths.push(prefix ? `${prefix}/${bChild.name}` : bChild.name);
            }
        }
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
        stats: { unpaired: 0, unpairedPaths: [] },
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

    // 内容指纹先于配对注入：pairChildren 的 name+contentHash 全等轮依赖 A/B（及复合模式下
    // master/B）两侧 hash 可比，否则同名兄弟在贪心兜底轮会按顺序错位注入 stableId。
    // B / masters 原地注入（文档化行为）；A 侧配对时用 contentHashOf 只读计算，不污染输入。
    annotateHashes(exportB);
    if (Array.isArray(mastersC)) {
        mastersC.forEach((master) => {
            if (master) annotateHashes(master);
        });
    }

    if (exportA) {
        pairWalk(exportA, exportB, '', ctx);
        // 配对失败可观测性：条件挂到 B 根（同构画板不写此 key，产物不受影响），
        // 插件端可据此上报/告警，避免「部分节点静默缺 stableId」无从定位
        if (ctx.stats.unpaired > 0) {
            (exportB as any).restorePairingStats = ctx.stats;
        }
    }

    // master 定义树也注入稳定 ID（components[*].tree 消费；hash 已在配对前注入）
    if (Array.isArray(mastersC)) {
        mastersC.forEach((master) => {
            if (!master) return;
            if ((master as any).symbolID) {
                // components 字典 key（与实例节点上注入的 restoreComponentKey 同一 ctx，保证一致）
                (master as any).restoreComponentKey = shortHashOf((master as any).symbolID, ctx.hash);
            }
            annotateMasterTree(master, ctx);
        });
    }

    return exportB;
};

export default annotateStableIds;
