/**
 * designTokens 聚合：画板 + 组件定义树去重汇总。
 * 一期实现「共享样式名 + 高频值聚合」两个来源；Color Variables（swatches）为文档级数据，
 * 画板级导出取不到变量名，降级为高频值自动命名（color-1 / text-1 按使用频次排序）。
 */
import { SKLayer } from '../types';
import { RestoreDesignTokens } from './restoreTypes';
import { fillsToRestore, bordersToRestore, textRunsToRestore, textStyleKey } from './normalize';

const COLOR_LIMIT = 24;
const TEXT_STYLE_LIMIT = 16;

type ColorStat = { value: string; usages: number };
type TextStat = {
    font?: string;
    size?: number;
    color?: string;
    lineHeight?: number;
    usages: number;
    sharedName?: string;
};

const collect = (layer: SKLayer, colors: { [hex: string]: ColorStat }, texts: { [key: string]: TextStat }): void => {
    const bumpColor = (hex?: string): void => {
        if (!hex) return;
        if (!colors[hex]) colors[hex] = { value: hex, usages: 0 };
        colors[hex].usages++;
    };

    // 与 mapNode 输出同源取色（fillsToRestore 已把 fill 级 contextSettings.opacity 并入 alpha 段），
    // 保证登记进 token 表的 hex 与节点 fills[].color 完全一致，linkTokens 查表才能命中
    fillsToRestore(layer).forEach((fill) => bumpColor(fill.color));
    bordersToRestore(layer).forEach((border) => bumpColor(border.color));

    if (layer._class === 'text' && layer.attributedString) {
        textRunsToRestore(layer).forEach((run) => {
            bumpColor(run.color);
            const key = textStyleKey(run);
            if (!texts[key]) {
                texts[key] = {
                    font: run.font,
                    size: run.size,
                    color: run.color,
                    lineHeight: run.lineHeight,
                    usages: 0,
                };
            }
            texts[key].usages++;
            // 共享文本样式名优先作为 token 名（插件端已回填 sharedTextStyleName）
            if (layer.sharedTextStyleName && !texts[key].sharedName) {
                texts[key].sharedName = layer.sharedTextStyleName;
            }
        });
    }

    if (Array.isArray(layer.layers)) {
        layer.layers.forEach(child => collect(child, colors, texts));
    }
};

/** @param trees 参与聚合的树列表（画板 + 各组件定义树），单树入参兼容保留 */
export const aggregateDesignTokens = (trees: SKLayer | SKLayer[]): RestoreDesignTokens => {
    const colorStats: { [hex: string]: ColorStat } = {};
    const textStats: { [key: string]: TextStat } = {};
    (Array.isArray(trees) ? trees : [trees]).forEach(tree => collect(tree, colorStats, textStats));

    const tokens: RestoreDesignTokens = {};

    const colorList = Object.keys(colorStats)
        .map(hex => colorStats[hex])
        .filter(stat => stat.usages >= 2)
        .sort((a, b) => b.usages - a.usages || (a.value < b.value ? -1 : 1))
        .slice(0, COLOR_LIMIT);
    if (colorList.length) {
        tokens.colors = {};
        colorList.forEach((stat, i) => {
            tokens.colors![`color-${i + 1}`] = { value: stat.value, usages: stat.usages };
        });
    }

    const textList = Object.keys(textStats)
        .map(key => textStats[key])
        .filter(stat => stat.usages >= 2 || !!stat.sharedName)
        .sort((a, b) => b.usages - a.usages || ((a.font || '') < (b.font || '') ? -1 : 1))
        .slice(0, TEXT_STYLE_LIMIT);
    if (textList.length) {
        tokens.textStyles = {};
        // key 统一为 text-N（按使用频次编号）；Sketch 共享样式原名落 sourceName，
        // 避免共享样式全名与自动命名混杂导致消费方无法按 key 规律遍历
        textList.forEach((stat, i) => {
            const entry: any = { usages: stat.usages };
            if (stat.font) entry.font = stat.font;
            if (stat.size !== undefined) entry.size = stat.size;
            if (stat.color) entry.color = stat.color;
            if (stat.lineHeight !== undefined) entry.lineHeight = stat.lineHeight;
            if (stat.sharedName) entry.sourceName = stat.sharedName;
            tokens.textStyles![`text-${i + 1}`] = entry;
        });
    }

    return tokens;
};

export default aggregateDesignTokens;
