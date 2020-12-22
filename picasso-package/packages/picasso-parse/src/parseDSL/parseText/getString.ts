import { SKLayer } from '../../types';

export default (layer:SKLayer):string => {
    // 直接可以获取string值
    if (layer.attributedString &&
        layer.attributedString.string
    ) {
        return layer.attributedString.string;
    }
    return '';
}
