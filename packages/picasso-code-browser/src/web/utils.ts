import { Layer } from '../types';

export const getSize = (data:Layer[]) => {
    return data[0].structure.width;
}
