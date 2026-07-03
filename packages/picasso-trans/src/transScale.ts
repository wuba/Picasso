import { Layer, PanelOptions } from './types';
import { _scale } from './common';

export const transScale = (data: Layer[], options : PanelOptions) => {
    const { scale } = options;
    const scaleData: Layer[] = JSON.parse(JSON.stringify(data));
    
    for (let i = 0; i < scaleData.length; i++) {
        const { structure } = scaleData[i];
        
        scaleData[i].structure = {
            ...scaleData[i].structure,
            x: _scale(structure.x, scale),
            y: _scale(structure.y, scale),
            width: _scale(structure.width, scale),
            height: _scale(structure.height, scale),
        }

        if (scaleData[i].structure.border) {
            scaleData[i].structure.border = {
                top: {
                    ...scaleData[i].structure.border.top,
                    width: _scale(scaleData[i].structure.border.top.width, scale),
                },
                right: {
                    ...scaleData[i].structure.border.right,
                    width: _scale(scaleData[i].structure.border.right.width, scale),
                },
                bottom: {
                    ...scaleData[i].structure.border.bottom,
                    width: _scale(scaleData[i].structure.border.bottom.width, scale),
                },
                left: {
                    ...scaleData[i].structure.border.left,
                    width: _scale(scaleData[i].structure.border.left.width, scale),
                }
            }
        }

        if (scaleData[i].style.width) {
            scaleData[i].style.width = _scale(scaleData[i].style.width,scale);
        }

        if(scaleData[i].style.height) {
            scaleData[i].style.height = _scale(scaleData[i].style.height,scale);
        }

        if (scaleData[i].style.textStyle) {
            if(scaleData[i].style.textStyle.fontSize) {
                scaleData[i].style.textStyle.fontSize = _scale(scaleData[i].style.textStyle.fontSize, scale);
            }
            if(scaleData[i].style.textStyle.letterSpacing) {
                scaleData[i].style.textStyle.letterSpacing =  _scale(scaleData[i].style.textStyle.letterSpacing, scale);
            }
            if(scaleData[i].style.textStyle.lineHeight) {
                scaleData[i].style.textStyle.lineHeight = _scale(scaleData[i].style.textStyle.lineHeight, scale);
            }
        }

        if (scaleData[i].style.lineHeight) {
            scaleData[i].style.lineHeight = _scale(scaleData[i].style.lineHeight, scale);
        }

        if (scaleData[i].style.boxShadow) {
            scaleData[i].style.boxShadow = scaleData[i].style.boxShadow.map(shadow=>({
                ...shadow,
                offsetX: _scale(shadow.offsetX, scale),
                offsetY: _scale(shadow.offsetY, scale),
                spread: _scale(shadow.spread, scale),
                blurRadius: _scale(shadow.blurRadius, scale)
            }))
        }

        if (scaleData[i].style.textShadow) {
            scaleData[i].style.textShadow = scaleData[i].style.textShadow.map(shadow =>({
                ...shadow,
                offsetX: _scale(shadow.offsetX, scale),
                offsetY: _scale(shadow.offsetY, scale),
                spread: _scale(shadow.spread, scale),
                blurRadius: _scale(shadow.blurRadius, scale)
            }))
        }

        if (scaleData[i].style.borderRadius) {
            const { bottomLeft, bottomRight, topLeft, topRight } = scaleData[i].style.borderRadius;

            scaleData[i].style.borderRadius = {
                bottomLeft: _scale(bottomLeft,scale),
                bottomRight: _scale(bottomRight,scale),
                topLeft: _scale(topLeft,scale),
                topRight: _scale(topRight,scale),
            }
        }

        if (scaleData[i].style.background?.radialGradient) {
            const { smallRadius, largeRadius, position } = scaleData[i].style.background.radialGradient;
            scaleData[i].style.background.radialGradient = {
                ...scaleData[i].style.background.radialGradient,
                smallRadius: _scale(smallRadius,scale),
                largeRadius: _scale(largeRadius,scale),
                position: {
                    left: _scale(position.left,scale),
                    top: _scale(position.top,scale),
                }
            }
        }

        if (Array.isArray(scaleData[i].children)) {
            scaleData[i].children = transScale(scaleData[i].children, options);
        }
    }

    return scaleData;
}
