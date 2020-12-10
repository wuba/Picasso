import * as fs from 'fs';
import * as path from 'path';
import picassoGroup from '../src';
import group_dsl from './fangcan_2027/group_dsl';

(async () => {
    try {
        
        const layout_dsl = picassoGroup(group_dsl);
        fs.writeFileSync(path.join(__dirname,`./fangcan_2027/layout_dsl.ts`), `const layout_dsl = ${JSON.stringify(layout_dsl,null,2)}`);
    } catch (error) {
        console.log(error);
    }
    
})()
