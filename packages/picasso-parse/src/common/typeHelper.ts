export const isNotUndefined = (data:any):boolean =>{
    try {
        if (data!==undefined) {
            return true;
        }
    } catch (e) {
    }
    return false;
}
