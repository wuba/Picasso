import { Layer, PanelOptions } from './types';
import { _scale } from './common';

export const transPanel = (data: Layer[], options : PanelOptions): any => {
    const { scale,unit } = options;

    for (let i = 0; i < data.length; i++) {
        const { panel } = data[i];
        
        if (panel) {
            const { properties, fills, typefaces, borders, shadows, code } = panel;

            // panel转换
            data[i].panelData = {
                properties: {
                    name: properties.name,
                    position: {
                        x: `${_scale(properties.position.x, scale)}${unit}`,
                        y: `${_scale(properties.position.y, scale)}${unit}`,
                    },
                    size: {
                        width: `${_scale(properties.size.width, scale)}${unit}`,
                        height: `${_scale(properties.size.height, scale)}${unit}`
                    },
                    opacity: properties.opacity ? `${properties.opacity*100}%`: '',
                    radius: properties.radius ? `${_scale(properties.radius, scale)}${unit}`: ''
                },
                fills,
                typefaces: typefaces.map(typeface =>{
                    const { fontSize, letterSpacing, lineHeight, paragraphSpacing } = typeface;
                    return {
                        ...typeface,
                        fontSize: `${_scale(fontSize, scale)}${unit}`,
                        letterSpacing: `${_scale(letterSpacing, scale)}${unit}`,
                        lineHeight: `${_scale(lineHeight, scale)}${unit}`,
                        paragraphSpacing: `${_scale(paragraphSpacing,scale)}${unit}`,
                    }
                }),
                borders: borders.map(border => {
                    const { thickness } = border;

                    return {
                        ...border,
                        thickness: `${_scale(thickness,scale)}${unit}`
                    }
                }),
                shadows: shadows.map((shadow) => {
                    const { offsetX, offsetY, blurRadius, spread } = shadow;
                    return {
                        ...shadow,
                        offsetX: `${_scale(offsetX,scale)}${unit}`,
                        offsetY: `${_scale(offsetY,scale)}${unit}`,
                        blurRadius: `${_scale(blurRadius,scale)}${unit}`,
                        spread: `${_scale(spread,scale)}${unit}`
                    }
                }),
                code
            };
        }
        

        if (data[i].type !== 'Text' && Array.isArray(data[i].children)) {
            data[i].children = transPanel(data[i].children, options);
        }
    }
    return data;
}
