const componentMap = require('../common/componentMap');

function generateBody(data, pageType, classPrefix) {
    let html = [];
    for (let i = 0; i < data.length; i++) {
        let record = data[i];
        if (record.type == componentMap.Image && (record.children && record.children.length == 0 || !record.children)) {
            if (+pageType === 2) { //全量都是背景图 运营专版
                record.style['background-image'] = `url(./images/${record.value})`;
                record.style['background-size'] = `${record.style.width}px ${record.style.height}px`;
                html.push(`<div class="${record.subClassName ? `${classPrefix + record.className} ${record.subClassName} ` : classPrefix + record.className}"></div>`);
            } else {
                html.push(`<img class="${record.subClassName ? `${classPrefix + record.className} ${record.subClassName} ` : classPrefix + record.className}" src="./images/${record.value}"/>`);
            }
        } else {
            let tag = (record.element && record.element.tag) ? record.element.tag : 'div';
            html.push(`<${tag} class="${record.addClassName ? `${record.addClassName} ${record.subClassName ? `${classPrefix + record.className} ${record.subClassName} ` : classPrefix + record.className}` : `${record.subClassName ? `${classPrefix + record.className} ${record.subClassName} ` : classPrefix + record.className}`}">`);
            if (record.children && record.type != componentMap.Text) { // 递归子children
                html.push(generateBody(record.children, pageType, classPrefix));
            }
            else if (record.children && record.type == componentMap.Text && !record.isMerged) {
                record.value = record.value ? record.value.replace(/ /ig, '&nbsp;') : record.value;
                record.value = record.value ? record.value.replace(/\n/ig, `<br/>${record.paragraphSpacing ? `<span class="p10" style="display:block;width:1px;height:${record.paragraphSpacing || 0}px;"></span>` : ''}`) : record.value;
                html.push(record.value || '');
                html.push(generateBody(record.children, pageType, classPrefix));
            } else {
                if (record.type == componentMap.Text) {
                    record.value = record.value ? record.value.replace(/ /ig, '&nbsp;') : record.value;
                    record.value = record.value ? record.value.replace(/\n/ig, `<br/>${record.paragraphSpacing ? `<span class="p10" style="display:block;width:1px;height:${record.paragraphSpacing || 0}px;"></span>` : ''}`) : record.value;
                    html.push(record.value || '');
                }
            }
            html.push(`</${tag}>`);
        }
    }
    return html.join('\n');
}
module.exports = generateBody;
