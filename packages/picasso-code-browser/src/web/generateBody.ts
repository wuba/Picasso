import { Layer } from '../types';

const generateBody = (data:Layer[],tab = '') => {
    let html = [];
    for (let i = 0; i < data.length; i++) {
        let record = data[i];
        if (record.type === 'Image' && !(record.children?.length>0)) {
            html.push(`${tab}<img class="${record.className}" src="${ record.value.indexOf('http') === 0 ? record.value :`../images/${record.value}` }"/>`);
        } else if(record.type === 'Text' && record.children?.length > 0) {
            const tag = 'div';

            html.push(`${tab}<${tag} class="${record.className}">`);
            record.children.forEach((layer) => {
                html.push(`${tab}    <span class="${layer.className}">`);
                html.push(`${tab}        ${layer.value || ''}`);
                html.push(`${tab}    </span>`);
            });
            html.push(`${tab}</${tag}>`);
        } else {
            // to be done
            const tag = 'div';
            html.push(`${tab}<${tag} class="${record.className}">`);
                if (record.type === 'Text') {
                    record.value = record.value.replace(/ /ig, '&nbsp;');
                    html.push(`${tab}    ${record.value || ''}`);
                }

                if(Array.isArray(record.children)) {
                    html.push(generateBody(record.children, tab+'    '));
                }
            html.push(`${tab}</${tag}>`);
        }
    }
    return html.join('\n');
}

export default generateBody;
