

const {
    handleSpanGroup,
    handleLabelList,
    handleMergeItem
} = require("./IdentifyLayout");

const handleLayer = require("./handleLayer");
const handleBorder = require("./handleBorder");
const formatTreeData = require("./formatTreeData");
const formatData = require("./formatData");
const domFormat = require("./domFormat");
const handleRow = require("./handleRow");
/**
 * 处理单层图层结构
 */
module.exports = (
    data,
    sketchId,
    sketchName,
    artboardIndex,
    artboardName,
) => {
    /**
     * 坐标缩放处理
     */
    data = formatTreeData(
        data,
        sketchId,
        sketchName,
        artboardIndex,
        artboardName
    );
    // 格式化
    data = formatData(data);
    // 结构处理
    data = domFormat(data);
    // 行列处理
    data = handleRow(data);
    // 列合并
    data = handleSpanGroup(data);
    // 多label标签识别
    data = handleLabelList(data);
    // 同一行中依据元素的聚合特性进行合并
    data = handleMergeItem(data);
    // 处理冗余结构
    data = handleLayer(data);
    // 存在虚假边框的问题，所以要放在后面
    data = handleBorder(data);
    // 边框处理掉后，再次处理冗余结构(因为会生成新的冗余结构)
    data = handleLayer(data);

    return data;
}
