function checkIntegerNumber(data){
    if(!parseInt(data) || !Number.isInteger(+data) || +data <= 0){
        return false;
    } else {
        return true;
    };
};

module.exports = {
    checkIntegerNumber
};