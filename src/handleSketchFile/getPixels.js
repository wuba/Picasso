
const getPixels = require("get-pixels");

module.exports = (imgPath)=>{
    return new Promise((resolve,reject)=>{
        getPixels(imgPath, function(err, pixels) {
            if(err) {
                reject(err);
            }else{
                resolve({
                    width:pixels.shape[0],
                    height:pixels.shape[1],
                    imgData:pixels.data
                });
            }
        })
    })
}