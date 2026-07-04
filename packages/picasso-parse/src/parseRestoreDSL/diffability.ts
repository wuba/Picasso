/**
 * 跨版本 diff 前置判定：两版 RestoreDSL 的可比性评估。
 *
 * 背景：三层 ID 规则的第一层（stableId = do_objectID 短哈希）依赖「同一画板迭代」；
 * UI 侧常见的「复制画板再改」（Sketch duplicate 给全部图层发新 UUID）会让 id 层整层失效，
 * 实测（意向_看过我 vs 其备份，205 节点）stableId 交集 0%、而 subtreeHash 剪枝仍覆盖 94%。
 * diff 消费方若先信任 id 层，会把整版误报为「全部删除 + 全部新增」。
 *
 * 本函数用两版的 id 交集率与 subtreeHash 命中率给出场景判定，供服务端在配对前选择策略：
 * - same-artboard：id 层可信，按 id → contentHash → styleHash → name 逐轮接力
 * - duplicated-artboard：id 层失效但内容高度相似（复制画板），跳过 id 轮直接走内容指纹
 * - unrelated：两版内容相似度过低，diff 结果仅供参考
 */
import { RestoreDSL, RestoreNode } from './restoreTypes';

export type DiffabilityVerdict = 'same-artboard' | 'duplicated-artboard' | 'unrelated';

export type DiffabilityReport = {
    verdict: DiffabilityVerdict;
    // 新版节点的 stableId 在旧版出现的比例（0~1）
    stableIdOverlap: number;
    // 新版节点的 subtreeHash 在旧版出现的比例（0~1，内容寻址，不依赖 id）
    subtreeHashOverlap: number;
    // 新版节点的 contentHash 在旧版出现的比例（0~1）
    contentHashOverlap: number;
    prevNodeCount: number;
    nextNodeCount: number;
};

// 判定阈值：id 交集低于 ID_DEAD 视为 id 层失效；内容命中高于 CONTENT_ALIVE 视为同源内容
const ID_DEAD_THRESHOLD = 0.2;
const CONTENT_ALIVE_THRESHOLD = 0.4;

const collectNodes = (root: RestoreNode): RestoreNode[] => {
    const nodes: RestoreNode[] = [];
    const walk = (node: RestoreNode): void => {
        nodes.push(node);
        (node.children || []).forEach(walk);
    };
    walk(root);
    return nodes;
};

const artboardOf = (input: RestoreDSL | RestoreNode): RestoreNode =>
    (input as RestoreDSL).artboard ? (input as RestoreDSL).artboard : (input as RestoreNode);

/**
 * @param prev 上一版 RestoreDSL（或其 artboard 节点树）
 * @param next 新一版 RestoreDSL（或其 artboard 节点树）
 */
export const assessRestoreDiffability = (
    prev: RestoreDSL | RestoreNode,
    next: RestoreDSL | RestoreNode,
): DiffabilityReport => {
    const prevNodes = collectNodes(artboardOf(prev));
    const nextNodes = collectNodes(artboardOf(next));

    const prevIds: { [id: string]: boolean } = {};
    const prevSubtree: { [hash: string]: boolean } = {};
    const prevContent: { [hash: string]: boolean } = {};
    prevNodes.forEach((node) => {
        if (node.id) prevIds[node.id] = true;
        if (node.subtreeHash) prevSubtree[node.subtreeHash] = true;
        if (node.contentHash) prevContent[node.contentHash] = true;
    });

    let idHit = 0;
    let subtreeHit = 0;
    let contentHit = 0;
    nextNodes.forEach((node) => {
        if (node.id && prevIds[node.id]) idHit++;
        if (node.subtreeHash && prevSubtree[node.subtreeHash]) subtreeHit++;
        if (node.contentHash && prevContent[node.contentHash]) contentHit++;
    });

    const total = nextNodes.length || 1;
    const stableIdOverlap = idHit / total;
    const subtreeHashOverlap = subtreeHit / total;
    const contentHashOverlap = contentHit / total;

    let verdict: DiffabilityVerdict;
    if (stableIdOverlap >= ID_DEAD_THRESHOLD) {
        verdict = 'same-artboard';
    } else if (contentHashOverlap >= CONTENT_ALIVE_THRESHOLD || subtreeHashOverlap >= CONTENT_ALIVE_THRESHOLD) {
        verdict = 'duplicated-artboard';
    } else {
        verdict = 'unrelated';
    }

    return {
        verdict,
        stableIdOverlap,
        subtreeHashOverlap,
        contentHashOverlap,
        prevNodeCount: prevNodes.length,
        nextNodeCount: nextNodes.length,
    };
};

export default assessRestoreDiffability;
