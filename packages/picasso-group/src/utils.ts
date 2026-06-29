export const uniqueId = () => {
    return Math.random().toString(32).substr(2, 8);
}
