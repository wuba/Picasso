module.exports = (data) => {
    if (data.length == 1 && data[0].style['overflow'] != 'hidden') {
        data[0].style['overflow'] = 'hidden'
    }
    return data;
}
