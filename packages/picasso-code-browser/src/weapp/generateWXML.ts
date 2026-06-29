import { Layer } from '../types';

const generateWXML = (data:Layer[]) => {
    let wxml = []
    for (let i = 0; i < data.length; i++){
        let record = data[i];
        if (record.type === 'Image') {
            wxml.push(`<image class="${record.className}" src="./images/${record.value}"/>`);
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
