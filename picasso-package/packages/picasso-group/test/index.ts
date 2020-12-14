import * as fs from 'fs';
import * as path from 'path';
import picassoGroup from '../src';
import dsl from './fangcan_2027/dsl';

(async () => {
    try {
        
        const group_dsl = picassoGroup(dsl);
        fs.writeFileSync(path.join(__dirname,`./fangcan_2027/group_dsl.ts`), `const group_dsl = ${JSON.stringify(group_dsl,null,2)}`);
    } catch (error) {
        console.log(error);
    }
    
})()
