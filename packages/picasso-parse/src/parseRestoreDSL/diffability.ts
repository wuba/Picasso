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

/**
 * 判定报告——含最终 verdict 与三个覆盖率原始值。
 * 消费方通常只看 verdict 选策略；三个 overlap 保留供人工诊断（"为什么被判为 X"）。
 * prevNodeCount / nextNodeCount 给 UI 侧展示"两版规模"或做异常检测（如空树告警）。
 */
export type DiffabilityReport = {
    verdict: DiffabilityVerdict; // 最终判定：same-artboard / duplicated-artboard / unrelated
    // 新版节点的 stableId 在旧版出现的比例（0~1）——id 层活跃度，> ID_DEAD_THRESHOLD 即判 same-artboard
    stableIdOverlap: number;
    // 新版节点的 subtreeHash 在旧版出现的比例（0~1，内容寻址，不依赖 id）——整棵子树未改动的占比
    subtreeHashOverlap: number;
    // 新版节点的 contentHash 在旧版出现的比例（0~1）——单节点自身内容未变的占比（比 subtreeHash 更宽松）
    contentHashOverlap: number;
    prevNodeCount: number; // 旧版节点总数（含画板根 + 全部后代）
    nextNodeCount: number; // 新版节点总数
};

// —— 判定阈值 ——
// ID_DEAD：id 交集低于此值视为 id 层失效（复制画板场景 stableId 交集实测 0%，20% 留出
//   小规模改动的容错——正常迭代改 10 个节点仍应保留 80%+ id 交集）。
// CONTENT_ALIVE：内容命中率高于此值视为同源内容（复制画板场景 subtreeHash 覆盖 94%，
//   40% 阈值可兜住"复制后大改一半"的边界情况，避免误判为 unrelated）。
const ID_DEAD_THRESHOLD = 0.2;
const CONTENT_ALIVE_THRESHOLD = 0.4;

/** 前序展平树 → 节点数组（供集合运算，不修改原树） */
const collectNodes = (root: RestoreNode): RestoreNode[] => {
    const nodes: RestoreNode[] = [];
    const walk = (node: RestoreNode): void => {
        nodes.push(node);
        (node.children || []).forEach(walk);
    };
    walk(root);
    return nodes;
};

/** 兼容入参：允许直接传 RestoreDSL 顶层，也允许传 artboard 子树（子树测试常用） */
const artboardOf = (input: RestoreDSL | RestoreNode): RestoreNode =>
    (input as RestoreDSL).artboard ? (input as RestoreDSL).artboard : (input as RestoreNode);

/**
 * 跨版本 diff 前置判定——按 id 交集率与内容命中率决定后续 diff 策略。
 *
 * 三阶段处理：
 *   1) 展平两版树 → 节点数组（前序，稳定顺序）
 *   2) 用 prev 建三张查找表（id / subtreeHash / contentHash 分别 O(1) 查），
 *      walk next 统计命中数——只用一遍循环，避免嵌套遍历 O(n²)
 *   3) 三种率算出后按阈值梯度判定 verdict（id 有效 → id 死 但内容存活 → 二者皆低）
 *
 * @param prev 上一版 RestoreDSL（或其 artboard 节点树）
 * @param next 新一版 RestoreDSL（或其 artboard 节点树）
 */
export const assessRestoreDiffability = (
    prev: RestoreDSL | RestoreNode,
    next: RestoreDSL | RestoreNode,
): DiffabilityReport => {
    // —— 阶段 1：展平两版树 ——
    const prevNodes = collectNodes(artboardOf(prev));
    const nextNodes = collectNodes(artboardOf(next));

    // —— 阶段 2a：prev 侧建三张查找表 ——
    // 用 { [key]: true } 而非 Set：Set 需 O(n) 转数组做集合测试，而对象键查找同样 O(1)
    // 且省一次转换。同一 hash/id 落多个节点时 `= true` 幂等覆盖，不改变命中语义
    const prevIds: { [id: string]: boolean } = {};
    const prevSubtree: { [hash: string]: boolean } = {};
    const prevContent: { [hash: string]: boolean } = {};
    prevNodes.forEach((node) => {
        if (node.id) prevIds[node.id] = true;
        if (node.subtreeHash) prevSubtree[node.subtreeHash] = true;
        if (node.contentHash) prevContent[node.contentHash] = true;
    });

    // —— 阶段 2b：walk next 一次，同时计三个命中数 ——
    // 三个维度互不干扰（一个节点可能 id 不中但 contentHash 中），必须独立统计
    let idHit = 0;
    let subtreeHit = 0;
    let contentHit = 0;
    nextNodes.forEach((node) => {
        if (node.id && prevIds[node.id]) idHit++;
        if (node.subtreeHash && prevSubtree[node.subtreeHash]) subtreeHit++;
        if (node.contentHash && prevContent[node.contentHash]) contentHit++;
    });

    // —— 阶段 3：算率 + 阈值判定 ——
    // 分母用 next 节点数——覆盖率语义是"新版有多少节点能在旧版找到"（回溯视角）；
    // 空树 || 1 兜底避免除零（结果为 0 rate，直接落 unrelated 分支）
    const total = nextNodes.length || 1;
    const stableIdOverlap = idHit / total;
    const subtreeHashOverlap = subtreeHit / total;
    const contentHashOverlap = contentHit / total;

    // 判定优先级：id 层活着优先（最强证据），其次内容层活着（复制画板兜底），最后 unrelated
    let verdict: DiffabilityVerdict;
    if (stableIdOverlap >= ID_DEAD_THRESHOLD) {
        verdict = 'same-artboard';
    } else if (contentHashOverlap >= CONTENT_ALIVE_THRESHOLD || subtreeHashOverlap >= CONTENT_ALIVE_THRESHOLD) {
        // subtreeHash 或 contentHash 任一达标就算——subtreeHash 更严格（含子树），
        // contentHash 更宽松（节点自身），任一命中都说明"复制来源"存在
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
