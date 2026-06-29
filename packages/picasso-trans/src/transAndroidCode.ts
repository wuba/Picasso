
import { Layer } from './types';
import { color2AHEX } from './colorTrans';

const  _getAndroidWithHeight = (panel) => "android:layout_width=\"" + panel.properties.size.width + "\"\r\n" + "android:layout_height=\"" + panel.properties.size.height + "\"\r\n";

const _getAndroidShapeBackground = (panel) => {
    const pureColorFill = panel.fills.find(item=>item.type===0);

    if (pureColorFill) {
        return "android:background=\"" + color2AHEX(pureColorFill.color) + "\"\r\n";
    }
    
    return '';
}

export const transAndroidCode = (data: Layer[]) => {
    for (let i = 0; i < data.length; i++) {
        const { panelData: panel } = data[i];

        const androidCode = [];

        if (data[i].type === "Text") {
            androidCode.push(
                "<TextView\r\n" + _getAndroidWithHeight(panel)
                + "android:text=\"" + data[i].value + "\"\r\n" + "android:textColor=\"" + color2AHEX(panel.typefaces[0].color) + "\"\r\n"
                + "android:textSize=\"" + panel.typefaces[0].fontSize.replace('dp','sp') + "\"\r\n" + "/>" + '</textarea></label>',
            );
        } else if (data[i].type === "Container"){
            androidCode.push(
                "<View\r\n" + _getAndroidWithHeight(panel)
                + _getAndroidShapeBackground(panel)
                + "/>"
            );
        }


        data[i].panelData.code =  androidCode.join('');

        if (data[i].type !== 'Text' && Array.isArray(data[i].children)) {
            data[i].children = transAndroidCode(data[i].children);
        }
    }

    return data;
}
