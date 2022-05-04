/**
 * Returned object
 * @typedef {Object} licenseKeyData 
 * @property {Number} ppk_num - ppk number
 * @property {String} key - ppk serial
 */

/**
 * Extracts ppk number and ppk serial from licence key
 * Throws error if validation fails or an error ocurres in checksum
 * @param {Number[]} license_key - array with 6 numbers
 * @returns {licenseKeyData}
 *  Example:  in: [126, 9, 6, 61, 10, 21]   out =>   { ppk_num: 52, key: '1813' }
 */
 function getDataFromLicenseKey(license_key) {
    if (license_key.constructor !== Array){
        throw new Error('Поле license_key повинно бути масивом (отримано ' + typeof license_key + ')');
    };
    if (license_key.length !== 6){
        throw new Error('Невірна кількість елемантів масиву license_key (повинно бути 6)');
    };
    for (let i = 0; i < license_key.length; i++) {
        if (typeof license_key[i] !== 'number' || Number.isNaN(license_key[i])){
            throw new Error('Нечислове значення ' + (i + 1) + 
                    '-го елементу масиву license_key (' + license_key[i] + ', ' + typeof license_key[i] + ')');
        }
    }; 

    function _decode(str) {
        let nabor_cifr = '5169304806665065381231661576';
        let b = -1;
        let a;
        let decode_str = '';
        for (a = 0; a < (str.length); a++) {
            b++;
            if (b == (nabor_cifr.length - 1)) b = 0;
            decode_str += String.fromCharCode(str.charCodeAt(a) - 
                    parseInt(nabor_cifr.charAt(b)));
        }
        return decode_str;
    }

    function _pad(num, size) {
        let s = num + '';
        while (s.length < size) s = '0' + s;
        return s;
    }

    function _GetChecksum(s) {
        let left, right, sum, i;
        left = 0x0056;
        right = 0x00AF;
        for (i = 0; i < (s.length); i++) {
            right += s.charCodeAt(i);
            if (right > 0x00FF) right -= 0x00FF;
            left += right;
            if (left > 0x00FF) left -= 0x00FF;
        }
        sum = (left << 8) + right;
        return sum.toString(16);
    }

    function _GetDChecksum(s) {
        let left, right, sum, i;
        left = 0x0056;
        right = 0x00AF;
        for (i = 0; i < (s.length); i++) {
            right += s.charCodeAt(i);
            if (right > 0x00FF) right -= 0x00FF;
            left += right;
            if (left > 0x00FF) left -= 0x00FF;
        }
        sum = (left << 8) + right;
        return sum.toString(10);
    }

    let d = _decode(String.fromCharCode(license_key[0]) + String.fromCharCode(license_key[1]) +
            String.fromCharCode(license_key[2]) + String.fromCharCode(license_key[3]) + 
            String.fromCharCode(license_key[4]) + String.fromCharCode(license_key[5]));

        //checksum
    let checksum = _pad(d.charCodeAt(0).toString(16), 2) + 
            _pad(d.charCodeAt(1).toString(16), 2);
    let calculated_checksum = parseInt(
        _GetChecksum(_GetDChecksum(d.substring(2)) + d.substring(2)), 16
    );
    if (calculated_checksum !== parseInt(checksum, 16)){
        throw new Error('Невірно введений ліцензійний ключ');
    };
    //ppk number
    let ppk_num = _pad(d.charCodeAt(2).toString(16), 2) + _pad(d.charCodeAt(3).toString(16), 2);

    //ppk serial 
    let decode_key = _pad(d.charCodeAt(4).toString(16), 2) + _pad(d.charCodeAt(5).toString(16), 2);

    //check for out of two bytes    
    decode_key = parseInt(decode_key, 16);
    if ((decode_key < 0) || (decode_key > 65535)){
        decode_key = 0;
    }
    decode_key = decode_key.toString();

    return {
        ppk_num: parseInt(ppk_num, 16),
        key: decode_key
    };
};

module.exports = {
    getDataFromLicenseKey
};