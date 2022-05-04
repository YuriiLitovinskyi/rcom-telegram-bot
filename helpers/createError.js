const colors = require('colors');
const sleep = require('./sleep');
const { logger } = require('./logger');

async function createError(error){
    console.log(`Error: ${error}`.red);
    logger.error(`Error:  ${error}`);  
    const warn = 'Application will be closed in 20 seconds';
    console.log(warn.yellow)
    logger.warn(warn);
    await sleep(20000);
    process.exit(1);
};

module.exports = {
    createError
};