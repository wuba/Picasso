import { Color } from './types';

/**
 * Color => HEX
 * @param color 
 */
export const color2HEX = (color: Color) => {
    const { red, green, blue, alpha } = color;
    const hex = "#" + ((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1);

    return {
        hex: hex.toUpperCase(),
        alpha: `${Math.round(alpha*100)}%`,
    };
}

/**
 * Color => AHEX
 * @param color 
 */
export const color2AHEX = (color: Color) => {
    const { red, green, blue, alpha } = color;
    const hex = ((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1);
    const a = ((1 << 8) + Math.round(alpha*255)).toString(16).slice(1);
    return "#" + (a+hex).toUpperCase();
}

/**
 * Color => HEXA
 * @param color 
 */
export const color2HEXA = (color: Color) => {
    const { red, green, blue, alpha } = color;
    const hex = ((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1);
    const a = ((1 << 8) + Math.round(alpha*255)).toString(16).slice(1);

    return `#${hex.slice(0,6).toLowerCase()}${a.toUpperCase()}`;
}

/**
 * Color => RGBA
 * @param color 
 */
export const color2RGBA = (color: Color) => {
    const { red, green, blue, alpha } = color;

    return `${red},${green},${blue},${alpha}`;
}

/**
 * Color => HSLA
 * @param color
 */
export const color2HSLA = (color: Color) => {
    let { red, green, blue, alpha } = color;

    red /= 255, green /= 255, blue /= 255;
    const max:number = Math.max(red, green, blue), min = Math.min(red, green, blue);
    let h:number, s:number, l:number = (max + min) / 2;

    if (max == min){ 
        h = s = 0; // achromatic
    } else {
        const d = max - min;

        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case red: h = (green - blue) / d + (green < blue ? 6 : 0); break;
            case green: h = (blue - red) / d + 2; break;
            case blue: h = (red - green) / d + 4; break;
        }
        h /= 6;
    }

    return `${Math.round(h*360)},${Math.round(s*100)}%,${Math.round(l*100)}%,${alpha}`;
}

/**
 * Color 产出不同格式的颜色值
 * @param color
 */
export const colorTrans = (color: Color) => {
    const hex = color2HEX(color);
    const ahex = color2AHEX(color);
    const hexa = color2HEXA(color);
    const rgba = color2RGBA(color);
    const hsla = color2HSLA(color);

    return [{
        type: 'HEX',
        value: hex.hex,
        alpha: hex.alpha
    },{
        type: 'AHEX',
        value: ahex,
    },{
        type: 'HEXA',
        value: hexa,
    },{
        type: 'RGBA',
        value: rgba,
    },{
        type: 'HSLA',
        value: hsla,
    }]
}
