const { getArtboardPlatform } = require('../../../common/sketchTools');
/**
 * 递归导入symbolMaster及symbolInstance传值处理
 * 注意：传值只用于自己的子模块
 * 规则：
 * 一.传值只用于自己的子模块
 * 二.外层传值会覆盖内部传值
 *  a.文本传值 直接替换
 *  b.symbolID传值 1.值为空，则进行删除处理 2.值不为空，则进行替换处理
 * @param {*} pageJson
 * @param {*} symbolMasterOverRideValueObj
 */
const handleOverRideValue = (pageJson, symbolMasterOverRideValueObj = {}, symbolMasterObj = {}, coverObj = {}) => {
    for (let i = 0; i < pageJson.layers.length; i++) {
        const item = pageJson.layers[i];
        let currS = JSON.parse(JSON.stringify(symbolMasterOverRideValueObj));
        let currCoverObj = JSON.parse(JSON.stringify(coverObj));
        //传值获取，只用于子元素模块使用，暂存到symbolMasterOverRideValueObj对象中
        if (item._class == 'symbolInstance' && item.symbolID) {
            if (!item.layers) {
                item.layers = [];
            }
            if (symbolMasterObj[item.symbolID] instanceof Object) {
                let curr = JSON.parse(JSON.stringify(symbolMasterObj[item.symbolID]));
                pageJson.layers[i].layers.push(curr);
            }
            if (Array.isArray(item.overrideValues)) {
                for (let j = 0; j < item.overrideValues.length; j++) {
                    const currItem = item.overrideValues[j];
                    if (currItem._class == 'overrideValue') {
                        let id = currItem.overrideName.split('_')[0];
                        let type = currItem.overrideName.split('_')[1];
                        let val = currItem.value;
                        if (/\//.test(id)) {
                            let coverId = id.split('\/')[0];
                            id = id.split('\/')[1];
                            if (!currCoverObj[coverId]) {
                                currCoverObj[coverId] = {}
                            }
                            currCoverObj[coverId][id] = {
                                type,
                                val
                            }
                        } else {
                            currS[id] = {
                                type,
                                val
                            };
                        }
                    }
                }
                //外层的传值要覆盖本层的传值
                if (item.do_objectID && currCoverObj[item.do_objectID]) {
                    currS = {
                        ...currS,
                        ...currCoverObj[item.do_objectID]
                    };
                }
            }
        }
        //传值使用
        // 图片的情况
        // {
        //   "_class": "overrideValue",
        //   "overrideName": "B16F54DE-664B-4D7E-AE12-67ACD4E90AEA_image",
        //   "value": {
        //     "_class": "MSJSONFileReference",
        //     "_ref_class": "MSImageData",
        //     "_ref": "images\/a467f28ce232edfcf4bb1d7603395bdd1c39e700.png"
        //   }
        // }
        /**
         * "image": {
              "_class": "MSJSONFileReference",
              "_ref_class": "MSImageData",
              "_ref": "images\/f30e867d3cbd71caef96397a34e7f8be31cfa8af.png"
            }
         */
        if (item.do_objectID && currS[item.do_objectID]) {
            let currOverRideValueObj = currS[item.do_objectID];
            //图片传值替换
            if (currOverRideValueObj.type == 'image' && item.image) {
                pageJson.layers[i].image = JSON.parse(JSON.stringify(currOverRideValueObj.val));
                //文本替换
            } else if (currOverRideValueObj.type == 'stringValue' &&
                item._class == 'text' && item.attributedString) {
                pageJson.layers[i].attributedString.string = currOverRideValueObj.val;
                //对文本传值做标记
                pageJson.layers[i].isTranValue = true;
                //symbolID
            } else if (currOverRideValueObj.type == 'symbolID' &&
                item._class == 'symbolInstance'
            ) {
                //如果val不为空，则进行替换处理
                if (currOverRideValueObj.val != '') {
                    if (symbolMasterObj[currOverRideValueObj.val]) {
                        pageJson.layers[i].layers = [JSON.parse(JSON.stringify(symbolMasterObj[currOverRideValueObj.val]))];
                    }
                    //如果val为空，则进行删除处理
                } else {
                    pageJson.layers[i].isDelete = true;
                }
            }
        }
        if (Array.isArray(pageJson.layers[i].layers)) {
            let currSymbolMasterOverRideValueObj = JSON.parse(JSON.stringify(currS));
            let currCoverObj2 = JSON.parse(JSON.stringify(currCoverObj));
            pageJson.layers[i] = handleOverRideValue(pageJson.layers[i], currSymbolMasterOverRideValueObj, symbolMasterObj, currCoverObj2);
        }
    }
    //进行删除操作
    let currPageJson = [];
    pageJson.layers.forEach(item => {
        if (!item.isDelete) {
            currPageJson.push(JSON.parse(JSON.stringify(item)));
        }
    })
    pageJson.layers = currPageJson;
    return pageJson;
}
/**
 * 原理：
 * symbolMaster 模块本体
 * symbolInstance 模块引入
 * symbolID  每一个模块的唯一标识
 * 
 * @param {Array} data
 */
const parseSymbol = (data, sketchId, sketchName, artboardIndex, artboardName, errorObj, uuid) => {
    //模块列表
    let symbolMasterList = [];
    let pageList = [];
    data.forEach(item => {
        if (Array.isArray(item.layers) && item.layers.length > 0 && item.layers[0]._class == 'symbolMaster') {
            symbolMasterList = item.layers;
        } else {
            pageList.push(item);
        }
    })
    //页面json
    let pageJson = pageList[0];
    //多artboard画板处理
    let currPage = '';
    for (let j = 0; j < pageList.length; j++) {
        pageJson = pageList[j];
        for (let i = 0; i < pageJson.layers.length; i++) {
            const currItem = pageJson.layers[i];
            if (currItem._class == 'artboard' && currItem.do_objectID == uuid) {
                currPage = currItem;
                break;
            }
        }
    }
    //pageJson只保留这一个artboard
    if (currPage) {
        pageJson.layers = [currPage];
    }
    if (symbolMasterList.length == 0) {
        const size = currPage && currPage.frame && currPage.frame.width ? currPage.frame.width : pageJson.frame.width;
        return {
            data: pageJson,
            platform: getArtboardPlatform(size),
            size,
        };
    } else {
        const symbolMasterObj = {};
        //模块传值对象
        const symbolMasterOverRideValueObj = {};
        for (let i = 0; i < symbolMasterList.length; i++) {
            const item = symbolMasterList[i];
            if (item.symbolID && item._class == 'symbolMaster') {
                if (item.frame) {
                    item.frame.x = 0;
                    item.frame.y = 0;
                }
                symbolMasterObj[item.symbolID] = JSON.parse(JSON.stringify(item));
            }
        }
        try {
            //模块传值处理
            pageJson = handleOverRideValue(pageJson, symbolMasterOverRideValueObj, symbolMasterObj, errorObj);
        } catch (error) {
            console.log('parseSymbol模块传值处理异常',error);
        }
        const size = currPage && currPage.frame && currPage.frame.width ? currPage.frame.width : pageJson.frame.width;
        return {
            data: pageJson,
            platform: getArtboardPlatform(size),
            size,
        }
    }
}

module.exports = parseSymbol
