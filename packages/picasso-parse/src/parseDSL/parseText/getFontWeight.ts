// 注意： 字体粗细的设置和 skecth 稿中设置什么字体有关
import { FontWeight } from '../../types';

export default (attrName: string): FontWeight => {
    if (/black|heavy/i.test(attrName)) {
        return 900;
    } else if (/ultrabold|extrabold/i.test(attrName)) {
        return 800;
    } else if (/bold|boldmt|psboldmt/i.test(attrName)) {
        return 700;
    } else if (/semibold|demibold/i.test(attrName)) {
        return 600;
    } else if (/medium/i.test(attrName)) {
        return 500;
    } else if (/roman|regular|normal|book/i.test(attrName)) {
        return 400;
    } else if (/light/i.test(attrName)) {
        return 300;
    } else if (/extralight|ultralight/i.test(attrName)) {
        return 200;
    } else if (/thin/i.test(attrName)) {
        return 100;
    }
}
