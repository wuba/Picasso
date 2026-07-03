
import { Layer } from './types';

export const transIOSCode = (data: Layer[]) => {
    for (let i = 0; i < data.length; i++) {
        const { panelData: panel } = data[i];
        const iosCode = [];

        if (data[i].type === "Text") {
            iosCode.push(
                "UILabel *label = [[UILabel alloc] init];\r\n"
                + "label.frame = CGRectMake(" + panel.properties.position.x + "\, " + panel.properties.position.y + "\, "
                + panel.properties.size.width + "\, " + panel.properties.size.height + ");\r\n"
                + "label.text = \@\"" + data[i].value + "\";\r\n"
                + "label.font = [UIFont fontWithName:\@\"" + panel.typefaces[0].fontFamily + "\" size:" + panel.typefaces[0].fontSize + "];\r\n"
                + "label.textColor = [UIColor colorWithRed:" + panel.typefaces[0].color.red + "/255.0 green:" + panel.typefaces[0].color.red + "/255.0 blue:" + panel.typefaces[0].color.blue + "/255.0 alpha:" + panel.typefaces[0].color.alpha + "/1.0];\r\n"
            );
        } else if (data[i].type === "Container"){
            let bgColorCode = '';
            const pureColorFill:any = panel.fills.find(item=>item.type===0);

            if (pureColorFill) {
                bgColorCode = "view.backgroundColor = [UIColor colorWithRed:" + pureColorFill.color.red + "/255.0 green:" + pureColorFill.color.green  + "/255.0 blue:" + pureColorFill.color.blue + "/255.0 alpha:" + pureColorFill.color.alpha + "/1.0]\;\r\n"
            }
            iosCode.push(
                "UIView *view = [[UIView alloc] init];\r\n"
                + "view.frame = CGRectMake(" + panel.properties.position.x + "\, " + panel.properties.position.y + "\, "
                + panel.properties.size.width + "\, " + panel.properties.size.height + ");\r\n"
                + bgColorCode
            );
        }

        data[i].panelData.code =  iosCode.join('');

        if (data[i].type !== 'Text' && Array.isArray(data[i].children)) {
            data[i].children = transIOSCode(data[i].children);
        }
    }
    return data;

}

