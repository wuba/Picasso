import { DSL,Layer } from './types';

const insert = (newLayer:Layer, layers:Layer[]) => {
    const { x: nx, y: ny, width: nwidth, height: nheight } = newLayer.structure;
    if (!layers || layers.length === 0) {
        layers[0] = newLayer;
        return;
    }

    let pos = -1;

    for (let index = 0; index < layers.length; index++) {
        const layer = layers[index];
        const { x, y, width, height } = layer.structure;

        // TODO 误差量
        if (x <= nx + 1 && x + width + 1 >= nx + nwidth
            && y <= ny + 1 && y + height + 1 >= ny + nheight) {
            // if (!layer.children) layer.children = [];
            // insert(newLayer, layer.children);
            // return;
            pos = index;
        }
    }

    if (pos !== -1) {
        const layer = layers[pos];
        if (!layer.children) layer.children = [];
        insert(newLayer, layer.children);
    } else {
        layers.push(newLayer);
    }
}

const pow2 = (n:number) => {
    return Math.pow(n, 2);
}

function sortData(data:Layer[]) {
    const newData = [];
    const offset = 20000;
    // data.sort(({ x: x1, y: y1 }, { x: x2, y: y2 }) => {
    //     return (Math.pow(x1, 2) + Math.pow(y1 + offset, 2)) - (Math.pow(x2, 2) + Math.pow(y2 + offset, 2));
    // }).sort(({ x: x1, y: y1, height: height1 }, { x: x2, y: y2, height: height2 }) => {
    //     if ((y1 >= y2 && y1 + height1 <= y2 + height2) || (y1 <= y2 && y1 + height1 >= y2 + height2)) {
    //         return x1 - x2;
    //     }
    //     return (Math.pow(x1, 2) + Math.pow(y1 + offset, 2)) - (Math.pow(x2, 2) + Math.pow(y2 + offset, 2));
    // })
    // .forEach((layer, i) => {
    //     layer.index = i;
    //     insert(layer, newData);
    // });
    // return newData;

    const len = data.length;
    for (let i = 0; i < len; i++) {
        for (let j = 0; j < len - 1; j++) {
            const { x: x1, y: y1, width: width1, height: height1 } = data[j].structure;
            const { x: x2, y: y2, width: width2, height: height2 } = data[j + 1].structure;
            if (x1 === x2 && y1 === y2) {
                if (width1 * height1 < width2 * height2) {
                    [data[j], data[j + 1]] = [data[j + 1], data[j]];
                }
            } else if ((y1 >= y2 && y1 + height1 <= y2 + height2) ||
                (y1 <= y2 && y1 + height1 >= y2 + height2)) {
                if (x1 > x2) {
                    [data[j], data[j + 1]] = [data[j + 1], data[j]];
                }
            } else if ((pow2(x1) + pow2(y1 + offset)) > (pow2(x2) + pow2(y2 + offset))) {
                [data[j], data[j + 1]] = [data[j + 1], data[j]];
            }
        }
    }

    data.forEach((layer, i) => {
        layer.structure.zIndex = i;
        insert(layer, newData);
    });

    return newData;
}


const getXYWH = (arr) => {
    let ax = arr[0].x;
    let ay = arr[0].y;
    let awidth = arr[0].width;
    let aheight = arr[0].height;

    for (let { x, y, width, height } of arr) {
        if (x < ax) ax = x;
        if (y < ay) ay = y;
        if (x + width > ax + awidth) awidth = x + width - ax;
        if (y + height > ay + aheight) aheight = y + height - ay;
    }

    return {
        x: ax,
        y: ay,
        width: awidth,
        height: aheight,
    }
}

const getMax = (arr:DSL, edgeFlag = true) => {
    // 分组
    const arrMap = new Map();
    arr.forEach((d) => {
        const { width, height } = d.structure;
        const wh = `${width},${height}`;
        const { n, nArr } = arrMap.get(wh) || { n: 0, nArr: [] };
        nArr.push(d);
        arrMap.set(wh, {
            n: n + 1,
            nArr,
        });
    });

    let maxKey = null;
    let maxN = 0;
    const arrWide = getXYWH(arr);

    let len = arr.length;
    while (len) {
        len--;
        for (const [key, { n }] of arrMap) {
            if (n > maxN) {
                maxN = n;
                maxKey = key;
            }
        }

        if (maxN === 1) break;

        const maxArr = arr.filter(({ structure }) => {
            const { width, height } =structure;
            // 大小容差
            return `${width},${height}` === maxKey;
        });

        const overlappingFlag = arr.reduce((prev, curr) => {
            if (!prev) return curr;
            if (prev === true) return true;

            const { x: px, y: py, width: pwidth, height: pheight } = prev;
            const { x, y, width, height } = curr.structure;
            return !(px > x + width || px + pwidth < x || py > y + height || py + pheight < y)}, false);

        // const maxArrWide = getXYWH(maxArr);
        const { structure: { x, y }, type } = maxArr[0];

        if (type === 'Text') {
            arrMap.delete(maxKey);
            maxN = 1;
        } else if (edgeFlag && x !== arrWide.x && y !== arrWide.y) {
            arrMap.delete(maxKey);
            maxN = 1;
        } else if (overlappingFlag === true) {
            arrMap.delete(maxKey);
            maxN = 1;
        } else {
            break;
        }
    }

    return { maxKey, maxN };
}

const groupData = (arr: Layer[], p?: Layer) => {
    if (!arr || arr.length === 0) return;
    if (arr.length <= 1) {
        if (arr[0].children) {
            groupData(arr[0].children, arr[0]);
        }
        return;
    }

    let { maxKey, maxN } = getMax(arr);

    const groupLayers:any = [];
    for (let i = 0; i < arr.length; i++) {
        const d = arr[i];
        // if (d.id === '9a2sea9u') debugger;

        if (d.textContainer !== true && d.children && d.children.length > 0) groupData(d.children, d);

        if (maxN === 1 || d.sign === '__li') {
            groupLayers[i] = d;
            continue;
        }

        const { width: dWidth, height: dHeight } = d.structure;

        if (!groupLayers[0]) groupLayers[0] = [];
        if (groupLayers.length <= 1 && `${dWidth},${dHeight}` !== maxKey) {
            groupLayers[0].push(d);
            continue;
        }

        // TODO
        if (!groupLayers[1]) groupLayers[1] = [];
        if (`${dWidth},${dHeight}` === maxKey) {
            groupLayers[1].push([d]);
            groupLayers[1].sign = '__list';
        } else {
            const liLayers = groupLayers[1];
            if (liLayers.length > 1 && liLayers[liLayers.length - 1].length === liLayers[0].length) {
                groupLayers[2] = arr.slice(i);
                break;
            }

            liLayers[liLayers.length - 1].push(d);
        }
    }

    if (maxN > groupLayers[1].length) {
        groupLayers.length = 0;
        groupLayers.push([...arr]);
    }

    // if (p && p.id === '5sj0hqpc') debugger;
    if (groupLayers[1] && Array.isArray(groupLayers[1]) && groupLayers[1][0].sign === '__list') {
        const overlappingFlag = groupLayers[1].reduce((prev, curr) => {
            if (!prev) return curr;
            if (prev === true) return true;

            const { x: px, y: py, width: pwidth, height: pheight } = getXYWH(prev);
            const { x, y, width, height } = getXYWH(curr);
            return !(px > x + width || px + pwidth < x ||
                py > y + height || py + pheight < y)
        }, false);

        if (overlappingFlag === true) {
            groupLayers.length = 0;
            groupLayers.push([...arr]);
        }
    }

    if (maxN === 1) {
        const { width: mwidth, height: mheight } = getXYWH(arr);

        const segArr = [];
        arr.forEach((d, i) => {
            if ((d.structure.width === mwidth && d.structure.height < 5) ||
                (d.structure.height === mheight && d.structure.width < 5)) segArr.push(i);
        });

        // TODO 如果第一个或者最后一个不分组
        // TODO 此处判断有待优化
        if (segArr.length > 0 && segArr.length < arr.length) {
            // debugger;
            groupLayers.length = 0;

            const newArr = [...arr];
            segArr.reduce((pv, cv, idx) => {
                groupLayers.push([...newArr.slice(pv, cv)]);
                if (p && p.sign === '__li') groupLayers[groupLayers.length - 1].sign = '__li';

                groupLayers.push([...newArr.slice(cv, cv + 1)]);

                if (cv === newArr.length - 1) return;
                if (idx === segArr.length - 1) {
                    groupLayers.push([...newArr.slice(cv + 1)]);
                    if (p && p.sign === '__li') groupLayers[groupLayers.length - 1].sign = '__li';
                }

                return cv + 1;
            }, 0);
        } else if (p && p.sign === '__li') {
            const __groupLayers = [];
            const YA = [];
            const fullWidthArr = [];
            for (let i = 0; i < arr.length; i++) {
                const d = arr[i];
                // if (d.id === 'lomlu25m') debugger;

                let flag = true;
                let { width: dWidth, x: dX } = d.structure;
                if (i === 0) {
                    YA[0] = { width: dWidth, x: dX };
                }
                if (p && dWidth === p.structure.width) {
                    fullWidthArr.push(d);
                    continue;
                }

                // TODO 先小后大 处理
                for (let j = 0; j < YA.length; j++) {
                    const { x: yX, width: yWidth } = YA[j];
                    // if (!(yX > dX || yX + yWidth < dX + dWidth)) {
                    if (!(yX > dX + dWidth || yX + yWidth < dX)) {
                        if (!__groupLayers[j]) __groupLayers[j] = [];
                        __groupLayers[j].push(d);
                        flag = false;
                        break;
                    }
                }

                if (flag) {
                    YA.push({ width: dWidth, x: dX });
                    const pos = YA.length - 1;
                    if (!__groupLayers[pos]) __groupLayers[pos] = [];
                    __groupLayers[pos].push(d);
                }
            }

            if (YA.length > 1) {
                groupLayers.length = 0;
                groupLayers.push(...__groupLayers.filter(l => !!l));
                groupLayers.push(fullWidthArr);
            }
        }
    }

    if (p) {
        if (!Array.isArray(groupLayers[0])) {
            return p.children = groupLayers;
        }

        // if (p && p.id === '5sj0hqpc') debugger;
        p.children = groupLayers.filter((gls) => gls.length > 0).map((gls) => {
            if (gls.length === 1) {
                return gls[0];
            }

            // TODO
            const c = gls.map(gl => {
                if (!Array.isArray(gl)) return gl;
                if (gl.length === 1) {
                    if (gls.sign === '__list') gl[0].sign = '__li';
                    return gl[0];
                }

                return {
                    sign: gls.sign === '__list' ? '__li' : '__oth',
                    ...getXYWH(gl),
                    children: gl,
                };
            });

            const cp = {
                sign: gls.sign ? gls.sign : '__oth',
                ...getXYWH(c),
                children: c,
            }

            return cp;
        });

        // if (p && p.id === '5sj0hqpc') debugger;
        if (p.children.length === 1 && p.children[0].sign) {
            p.children = p.children[0].children;
        }

        p.children.forEach((pc) => {
            if (pc.sign === '__list') {
                pc.children.forEach((pcc) => {
                    // debugger;
                    pcc.children && groupData(pcc.children, pcc);
                });
                return;
            }
            if (pc.children && pc.children.length > 0 && pc.children[0].sign !== '__li') {
                pc.children && groupData(pc.children, pc);
            }
        });
    }
}

const domFormat = (data:DSL) => {
    const [artboard, ...childData] = data;
    const newData = sortData(childData);

    groupData(newData);

    artboard.children = newData;

    return [artboard];
}

export default domFormat;

