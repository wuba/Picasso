
const fs = require('fs');
const data = fs.readFileSync('./list.text', 'utf-8');
const arr = data.split('\n')
const res = [];

// 生成 className列表
for (let i = 0; i < arr.length; i++) {
    const reg = /[a-zA-Z]+/gi;
    const str = arr[i];
    if (str.match(reg)) {
        res.push(...str.match(reg));
    }
}
fs.writeFileSync('./classNameList.json', JSON.stringify(res, null, 4), 'utf-8');