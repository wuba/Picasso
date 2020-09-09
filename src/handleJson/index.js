const getClassName = require("./getClassName");
const { uniqueId } = require('../common/utils');
const componentMap = require("../common/componentMap");
const { CLASSNAME_TYPE } = require("../common/global");
const { PLATFORM, CLASS_TYPE } = require("../common/global");

const generateConfigJson = async (
    data,
    sketchId,
    sketchName,
    artboardIndex,
    artboardName,
    classNameType,
    platform,
    parent = ""
) => {
    for (let i = 0; i < data.length; i++) {
        let currItem = {};
        currItem = JSON.parse(JSON.stringify(data[i])); // 防止一些属性没有算到, 到最后需要删除掉
        data[i].type = data[i].type || "Container";
        currItem.comKey =
            data[i].type == "Container" || data[i].type == "Image"
                ? `com${uniqueId()}`
                : `no${uniqueId()}`;
        currItem.type = componentMap[data[i].type];
        if (Array.isArray(data[i].children)) {
            currItem.children = [...data[i].children];
        }
        currItem.style = {
            width: data[i].width,
            ...data[i].style,
            height: data[i].height
        };
        if (platform == PLATFORM.pc) {
            // pc 端处理  border造成的width和height（大2px问题）;
            if (data[i].border && data[i].border.width) {
                //高度
                currItem.style["height"] = data[i].height - data[i].border.width * 2;
                //宽度处理
                currItem.style["width"] =
                    currItem.style["width"] - data[i].border.width * 2;
            } else {
                currItem.style["height"] =
                    data[i].height -
                    (data[i].style && data[i].style["border-bottom"]
                        ? data[i].style["border-bottom"]
                        : 0) -
                    (data[i].style && data[i].style["border-top"]
                        ? data[i].style["border-top"]
                        : 0);
            }
        }
        //向左布局的Row 都不设置宽度
        if (data[i].name == "Row") {
            if (
                currItem.style &&
                currItem.style["justify-content"] &&
                currItem.style["justify-content"] == "space-between"
            ) {
                if (parent && currItem.x + currItem.width == parent.x + parent.width) {
                    currItem.style.width = "auto";
                }
            } else if (currItem.style["margin-left"] !== currItem.style["margin-right"]) {
                currItem.style.width = "auto";
            }
        }

        // 把class生成
        //去掉背景图以及样式
        if (Array.isArray(currItem.children) && currItem.children.length > 0 && currItem.type && currItem.type == componentMap.Image) {
            currItem.style = {
                ...currItem.style,
                "background-image": `url(./images/${currItem.value})`
            };
            delete currItem.style['background-position'];
            delete currItem.style['background-repeat'];
        } else if (currItem.type == componentMap.Image) {
            delete currItem.style['background-position'];
            delete currItem.style['background-size'];
            delete currItem.style['background-repeat'];
        }

        // 生成 classname 类别的判断
        if (currItem.class_name) {
            if (parent && parent.className) {
                if (currItem.class_type === CLASS_TYPE.RELY_ON_CHILD_AND_PARENT) {
                    if (/-ul$/.test(parent.className)) {
                        parent.className = parent.className.slice(0, -3);
                    }
                    currItem.className = `${parent.className}-${currItem.class_name}`;
                    parent.className = `${parent.className}-ul`;
                } else if (currItem.class_type === CLASS_TYPE.RELY_ON_PARENT) {
                    currItem.className = `${parent.className}-${currItem.class_name}`;
                } else {
                    currItem.className = currItem.class_name;
                }
            } else {
                currItem.className = currItem.class_name;
            }
        }
        if (!currItem.className) {
            currItem.className =
                CLASSNAME_TYPE.RANDOM == classNameType
                    ? "_" + uniqueId()
                    : getClassName();

            if (currItem.element && currItem.element.tag == "ul") {
                // ul 的子元元素类名一样
                let liClassName =
                    CLASSNAME_TYPE.RANDOM == classNameType
                        ? "_" + uniqueId()
                        : getClassName();
                for (let ref of currItem.children) {
                    ref.className = liClassName;
                }
            }
        }
        data[i] = currItem;
        if (Array.isArray(data[i].children)) {
            data[i].children = await generateConfigJson(
                data[i].children,
                sketchId,
                sketchName,
                artboardIndex,
                artboardName,
                classNameType,
                platform,
                data[i]
            );
        }
    }
    return data;
};

module.exports = generateConfigJson;
