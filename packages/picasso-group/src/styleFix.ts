import { DSL,Layer,Component } from './types';

const styleFix = (dsl: DSL) => {
    dsl.map((layer) => {
        // 图片包含子元素的情况
        if (layer.type === 'Image' && layer.children?.length > 0) {
            layer.type = 'Container';
            layer.style.background = {
                image: {
                    url: layer.value
                },
                size: {
                    width: layer.structure.width,
                    height: layer.structure.height
                }
            };
            delete layer.style.borderRadius;
        }

        if (Array.isArray(layer.children)) {
            layer.children = styleFix(layer.children);
        }

        return layer;
    })

    return dsl;
};

export default styleFix;




