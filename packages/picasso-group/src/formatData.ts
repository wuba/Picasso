import { DSL } from './types';

const _format = (components: DSL, x = 0, y = 0) => {
    for (let item of components) {
        //处理成整数
        item.structure.y = Math.round(item.structure.y - y);
        item.structure.x = Math.round(item.structure.x - x);
        item.structure.width = Math.round(item.structure.width);
        item.structure.height = Math.round(item.structure.height);
        if (item.children && item.children.length) {
            _format(item.children,x,y);
        }
    }
}

export default (dsl:DSL) => {
    const rootComponent = dsl[0];
    const x = rootComponent.structure.x;
    const y = rootComponent.structure.y;
    const components = rootComponent.children;

    _format(components,x,y);
    rootComponent.structure.x = 0;
    rootComponent.structure.y = 0;

    return [{...rootComponent, children:[]},...rootComponent.children];
};
