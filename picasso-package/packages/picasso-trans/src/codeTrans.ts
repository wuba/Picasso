
/**
 * Base64 加密、解密算法封装：
 */
function Base64() {
    // private property
    let _keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='

    // private method for UTF-8 encoding
    function _utf8_encode(string) {
        string = string.replace(/\r\n/g, '\n')
        let utftext = ''
        for (let n = 0; n < string.length; n++) {
            let c = string.charCodeAt(n)
            if (c < 128) {
                utftext += String.fromCharCode(c)
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192)
                utftext += String.fromCharCode((c & 63) | 128)
            } else {
                utftext += String.fromCharCode((c >> 12) | 224)
                utftext += String.fromCharCode(((c >> 6) & 63) | 128)
                utftext += String.fromCharCode((c & 63) | 128)
            }
        }
        return utftext
    }

    // private method for UTF-8 decoding
    function _utf8_decode(utftext) {
        let string = ''
        let i = 0
        let c2, c1, c3
        let c = c1 = c2 = 0
        while (i < utftext.length) {
            c = utftext.charCodeAt(i)
            if (c < 128) {
                string += String.fromCharCode(c)
                i++
            } else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1)
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63))
                i += 2
            } else {
                c2 = utftext.charCodeAt(i + 1)
                c3 = utftext.charCodeAt(i + 2)
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63))
                i += 3
            }
        }
        return string
    }

    // public method for encoding
    this.encode = function(input) {
        let output = ''
        let chr1, chr2, chr3, enc1, enc2, enc3, enc4
        let i = 0
        input = _utf8_encode(input)
        while (i < input.length) {
            chr1 = input.charCodeAt(i++)
            chr2 = input.charCodeAt(i++)
            chr3 = input.charCodeAt(i++)
            enc1 = chr1 >> 2
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4)
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6)
            enc4 = chr3 & 63
            if (isNaN(chr2)) {
                enc3 = enc4 = 64
            } else if (isNaN(chr3)) {
                enc4 = 64
            }
            output = output +
                _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
                _keyStr.charAt(enc3) + _keyStr.charAt(enc4)
        }
        return output
    }

    // public method for decoding
    this.decode = function(input) {
        let output = ''
        let chr1, chr2, chr3
        let enc1, enc2, enc3, enc4
        let i = 0
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '')
        while (i < input.length) {
            enc1 = _keyStr.indexOf(input.charAt(i++))
            enc2 = _keyStr.indexOf(input.charAt(i++))
            enc3 = _keyStr.indexOf(input.charAt(i++))
            enc4 = _keyStr.indexOf(input.charAt(i++))
            chr1 = (enc1 << 2) | (enc2 >> 4)
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)
            chr3 = ((enc3 & 3) << 6) | enc4
            output = output + String.fromCharCode(chr1)
            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2)
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3)
            }
        }
        output = _utf8_decode(output)
        return output
    }
}
const base64Instance = new Base64();

// 编码
export const encodeTrans = base64Instance.encode;

// 解码标注数据
export const decodeMeatureTrans = (data: string) => {
    try {
        // base64解码
        let dsl = base64Instance.decode(data);
        dsl = dsl ? JSON.parse(dsl) : [];
        // 数据结构调整
        return [{...dsl,children: []},...(Array.isArray(dsl.children)?dsl.children:[])]
    } catch (error) {
        console.log(error);
        return []
    }
};

// 解码代码数据
export const decodeCodeTrans = (data: string) => {
    // base64解码
    let dsl = base64Instance.decode(data);
    dsl = dsl ? JSON.parse(dsl) : dsl;
    // 数据结构调整
    return dsl;
};
