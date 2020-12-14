import { TextStyle } from '../../types';
/**
 * 处理字间距
 */
export default (kerning:number):TextStyle => {
    if (kerning !== undefined && kerning !== 0) {
        return {
            letterSpacing: Math.round(kerning * 10) / 10
        }
    }
    return {}
}
