/**
 * LLM 还原精简视图（render profile）。
 *
 * RestoreDSL 全量产物同时服务 diff（hash 三元组）、组件分析（components/overrides）与
 * 视觉还原三类消费方。喂 LLM 做设计稿还原时，前两类字段是纯 token 负担
 * （实测三画板可减 31%~44% 体积），且完全透明（opacity 0）的占位子树还会诱导误渲染。
 *
 * 本函数产出「仅视觉还原所需」的深拷贝视图；输入不被修改。全量产物照常落库，
 * 精简视图只在喂给 LLM 前调用——两个消费场景各取所需，不牺牲 diff 能力。
 */
import { RestoreDSL, RestoreNode } from './restoreTypes';

// 对视觉还原无意义的节点级字段
const STRIP_KEYS: { [key: string]: boolean } = {
    contentHash: true,
    subtreeHash: true,
    styleHash: true,
    constraints: true,
    booleanOperation: true,
    componentKey: true,
    overrides: true,
};

const stripNode = (node: RestoreNode): RestoreNode | undefined => {
    // 完全透明的子树不参与渲染；保留 visible:false 已被上游 filterHideLayer 剔除，无需处理
    if (node.opacity === 0) return undefined;
    const out: any = {};
    Object.keys(node).forEach((key) => {
        if (STRIP_KEYS[key]) return;
        if (key === 'children') return;
        out[key] = (node as any)[key];
    });
    if (node.children && node.children.length) {
        const children: RestoreNode[] = [];
        node.children.forEach((child) => {
            const kept = stripNode(child);
            if (kept) children.push(kept);
        });
        if (children.length) out.children = children;
    }
    return JSON.parse(JSON.stringify(out));
};

export const toRenderProfile = (dsl: RestoreDSL): RestoreDSL => {
    const artboard = stripNode(dsl.artboard);
    return {
        schemaVersion: dsl.schemaVersion,
        meta: JSON.parse(JSON.stringify(dsl.meta)),
        designTokens: JSON.parse(JSON.stringify(dsl.designTokens)),
        // components 定义树对单画板视觉还原无用（实例已在 artboard 树中展开），整体裁掉
        components: {},
        artboard: artboard || JSON.parse(JSON.stringify(dsl.artboard)),
    };
};

export default toRenderProfile;
