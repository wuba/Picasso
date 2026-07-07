import { Layer } from '../types';

const generateWXML = (data:Layer[]) => {
    let wxml = []
    for (let i = 0; i < data.length; i++){
        let record = data[i];
        // 与 web/generateBody、rn/generateJSX 对齐：带 children 的 Image 是背景图容器，
        // 走下方 view 分支递归子节点，否则子节点内容会被自闭合 <image/> 静默丢弃
        if (record.type === 'Image' && !(Array.isArray(record.children) && record.children.length > 0)) {
            // 绝对 URL（插件已上传到 WOS 的切片/填充位图）直接引用，仅本地文件名拼 ./images/ 前缀
            const src = /^https?:\/\//.test(record.value) ? record.value : `./images/${record.value}`;
            wxml.push(`<image class="${record.className}" src="${src}"/>`);
        } else {
            if(record.type === 'Text'){
                wxml.push(`<view class="${record.className}">`);
                record.value = record.value.replace(/\n/g, '\\n') || '';
                wxml.push(record.value || '');
            }else{
                wxml.push(`<view class="${record.className}" >`);
            }
            if(Array.isArray(record.children)) {
                wxml.push(generateWXML(record.children));
            }
            if(record.type === 'Text'){
                wxml.push(`</view>`);
            }else{
                wxml.push(`</view>`);
            }
        }
    }
    return wxml.join('\n');
}

export default generateWXML;
