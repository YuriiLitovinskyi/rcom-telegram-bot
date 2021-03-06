process.env.NTBA_FIX_319 = 1;
const express = require('express');
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const colors = require('colors');

const connectDb = require('./db/db');
const { 
    readJournal, 
    updateJournalCollection, 
    updateJournalDoc,
    getPpkState,
    sendCommandToDevice, 
    registerUser, 
    updateDevice,
    updateDeviceSerialPass,
    deleteUser, 
    findAllUsers, 
} = require('./db/methods');
const { convertIdMessage, convertLineMessage } = require('./helpers/codesFromJournal');
const { decryptDeviceState } = require('./helpers/deviceStateDecryptor');
const { getDataFromLicenseKey } = require('./helpers/decodeLicenceKey');
const { logger } = require('./helpers/logger');
const { checkIntegerNumber } = require('./helpers/checkIntegerNumber');
const { buttonOptions4L, buttonOptions8L } = require('./helpers/groupButtons');
const { ABOUT, userMenuArray } = require('./helpers/text');
const { createError } = require('./helpers/createError');

const app = express();

const version = '1.0.1';
const author = 'Yurii Litovinskyi';
console.log(`ver: ${version}`.grey);
logger.info('******************************');
logger.info(`Rcom telegram bot version: ${version}`);
logger.info(`Author: ${author}`);
const serverPort = process.env.SERVER_PORT || 4622;
const mongoHost = process.env.MONGO_HOST || localhost;
const mongoPort = process.env.MONGO_PORT || 27017;
const TELEGRAM_TOKEN =  process.env.TELEGRAM_API_TOKEN;

const timer = 2000; // timer for checking new inserts in collection Journal
let users = [];
let mongoRcomConnection, bot;


connectDb(mongoHost, mongoPort, async (connection) => {    
    mongoRcomConnection = connection;    
    const journal = mongoRcomConnection.db.collection('Journal');
    
    
    try {
        const isCapped = await journal.isCapped();
        if(isCapped){            
            const error = `MongoError: Cannot update Journal collection (collection is Capped). Please try another MongoDB version.`;
            await createError(error);
        };

        const journalUpd = await updateJournalCollection(journal); 
        console.log(journalUpd.cyan);
        logger.info(journalUpd);
    
        users = await findAllUsers();        
    } catch (error) {      
        await createError(error);
    };
   
    setInterval(async () => {
        let journalData = [] 
        try {
            journalData = await readJournal(journal, timer);           
        } catch (error) { 
            await createError(error);             
        };

        for(let i = 0; i < users.length; i++){
            for(let j = 0; j < journalData.length; j++){                
                if(users[i].deviceNumber === journalData[j].ppk_num){                                  
                    if(journalData[j].isSentTelBot) continue;

                    try {
                        bot && bot.sendMessage(users[i].user_id, `???????????? ???${journalData[j].ppk_num}: ${convertIdMessage(journalData[j].id_msg)} ${journalData[j].line ? '???' + convertLineMessage(journalData[j].line) : ''}`);
                        logger.info(`User "${users[i].first_name}, ${users[i].phone_number}" received a message "code: ${journalData[j].id_msg}${journalData[j].line ? ', line:' + journalData[j].line : ''}" from device number "${journalData[j].ppk_num}"`);                    
                        await updateJournalDoc(journal, journalData[j]._id);
                    } catch (error) {
                        await createError(error);   
                    };
                };
            };
        };         
        journalData = null;        
    }, timer);   
});


app.listen(serverPort, async () => {
 
    const msg = `Server started on port ${serverPort}`;    
    console.log(msg.cyan);
    logger.info(msg);

    // check if telegram token exists
    if(!TELEGRAM_TOKEN){   
        const error = `Error: No telegram token in .env file! Application will be closed in 20 seconds`;
        await createError(error);       
    };
    try {
        // Create Telegram Bot
        bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
        const msgBot = `Bot created`;    
        console.log(msgBot.cyan);
        logger.info(`${msgBot}, token: "${TELEGRAM_TOKEN}"`);

        // User Menu
        bot.setMyCommands(userMenuArray);
              
        // Registration
        bot.onText(/\/start/, (msg, match) => {
            const chatId = msg.chat.id;
        
            bot.sendMessage(chatId, '?????? ???????????????????? ???????????????????? ?????? ???????????????????? ?????????? (????????/?????????????????? ???????? ??????????????)!');
        });
        
        // Delete user data and unsubscribe
        bot.onText(/\/stop/, async (msg) => {
            const chatId = msg.chat.id;          
            
            const user = users.find(user => user.user_id === chatId);

            if(!user){
                bot.sendMessage(chatId, '???????????????????? ???? ??????????????????! \n???????????????????????? ???????????????? ???????? ??????. ?????????? (????????/?????????????????? ???????? ??????????????)');
               return; 
            };
        
            try {                
                const result = await deleteUser(chatId);                
                logger.info(result);

                users = await findAllUsers();                
            
                bot.sendMessage(chatId, '?????? ???????? ???????? ???? ?????????????? ????????????????! \n????????i?????????? ??????????????????!');
            } catch (error) {
                logger.error(error);
                bot.sendMessage(chatId, '?????????????? ?????????????????? ???????????????? "?????????????????? ??????????????????????"!');
            };
        });
        
        // Info data about bot
        bot.onText(/\/about/, async (msg) => {
            const chatId = msg.chat.id;
        
            await bot.sendMessage(chatId, ABOUT);
        });
        
        // Register user phone
        bot.on('contact', async (msg) => {
            const user = msg.contact;
            const chatId = msg.chat.id;

            try {
                const result = await registerUser(user);            
                logger.info(result);         
            
                await bot.sendMessage(chatId, '?????????? ?????????????? ??????????????????????????!');
                users = await findAllUsers();
               
                await bot.sendMessage(chatId, '?????????????? ?????????? ?????????? ??????????????. ??????????????????: \n/addppk 703');      
                
            } catch (error) {
                logger.error(error);
                bot.sendMessage(chatId, '?????????????? ?????????????????? ???????????????? "???????????????????? ?????????????????????? ???????????? ??????????????????????"!');
            };        
        });
        
        // Add user device (subscribe)
        bot.onText(/\/addppk (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const deviceNumber = match[1];
        
            const user = users.find(user => user.user_id === chatId);    
        
            if(!user){
                bot.sendMessage(chatId, '???????????????????? ???? ??????????????????! \n???????????????????????? ???????????????? ???????? ??????. ?????????? (????????/?????????????????? ???????? ??????????????)');
               return; 
            };

            if(!checkIntegerNumber(deviceNumber)){
                await bot.sendMessage(chatId, '?????????????? ??????????????????! \n?????????? ?????????????? ?????????????? ???????? ?????????? ????????????!');
                return;
            };        

            try {
                const result = await updateDevice(+deviceNumber, chatId);                
                logger.info(result);             
               
                users = await findAllUsers();                       
                
                await bot.sendMessage(chatId, `???? ?????????????? ?????????????????? ???? ?????????? ?????????????? ???${deviceNumber}!`);                
            } catch (error) {
                logger.error(error);
                bot.sendMessage(chatId, '?????????????? ?????????????????? ???????????????? "?????????????????? ?????????????? ??????????????????????"!');
            };    
        });
        
        // Add user device serial and password
        bot.onText(/\/addserialpass (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const ppkSerialPass = match[1];
                         
            const user = users.find(user => user.user_id === chatId);    
        
            if(!user){
                bot.sendMessage(chatId, '???????????????????? ???? ??????????????????! \n???????????????????????? ???????????????? ???????? ??????. ?????????? (????????/?????????????????? ???????? ??????????????)');
               return; 
            };        
           
            if(!ppkSerialPass.includes(':')){
                await bot.sendMessage(chatId, `?????????????? ??????????????????! \n???????? ??????????, ?????????????? ???????????????? ?????????? ???? ???????????? ?????????????? ?? ?????????????? [serial]:[pass]. 
                                                    ??????????????????: \n/addserialpass 3389:123456`);
                return;
            };    
        
            const ppkSerialPassArr = ppkSerialPass.split(':');

            if(!checkIntegerNumber(ppkSerialPassArr[0])){
                await bot.sendMessage(chatId, '?????????????? ??????????????????! \n???????????????? ?????????? ?????????????? ?????????????? ???????? ?????????? ????????????!');
                return;
            };
            
            if(!checkIntegerNumber(ppkSerialPassArr[1])){
                await bot.sendMessage(chatId, '?????????????? ??????????????????! \n???????????? ?????????????? ?????????????? ?????????????? ???????? ?????????? ????????????!');
                return;
            };
        
            try {
                const result = await updateDeviceSerialPass(ppkSerialPassArr[0], ppkSerialPassArr[1], chatId);            
                logger.info(result);             
              
                users = await findAllUsers();            
            
                await bot.sendMessage(chatId, `???????????????? ?????????? ???? ???????????? ?????????????? ?????????????????? ??????????????!`);                
            } catch (error) {
                logger.error(error);
                bot.sendMessage(chatId, '?????????????? ?????????????????? ???????????????? "?????????????????? ?????????????????? ???????????? ???? ???????????? ??????????????"!');
            };
        });
        
        // Get current device state (to update state in MongoDB - use program "delete-ppk-rcom-x86.exe", and send Polling from Monitoring Station)
        bot.onText(/\/devicestate/, async (msg, match) => {
            const chatId = msg.chat.id;             
                    
            const user = users.find(user => user.user_id === chatId);           
            
            if(!user){
                bot.sendMessage(chatId, '???????????????????? ???? ??????????????????! \n???????????????????????? ???????????????? ???????? ??????. ?????????? (????????/?????????????????? ???????? ??????????????)');
                return; 
            };
            
            if(!user.deviceNumber){
                bot.sendMessage(chatId, '???? ???????????? ????????????! \n????????i???? ?????????? ?????????? ??????????????. \n??????????????????: \n/addppk 703');
                return; 
            };
            
            try {
                const ppkState = mongoRcomConnection.db.collection('ppkState');
                const deviceState = await getPpkState(ppkState, user.deviceNumber);
                        
                if(!deviceState){
                    bot.sendMessage(chatId, `???? ?????????????? ???? ???????????????? ???????? ?????????????? ${user.deviceNumber}`);
                    return;
                };
                               
                bot.sendMessage(chatId, JSON.stringify(decryptDeviceState(deviceState), 0, 2));
                logger.info(`User "${user.first_name}, ${user.phone_number}" requested device number "${user.deviceNumber}" state`);                
            } catch (error) {                
                logger.error(error);
                bot.sendMessage(chatId, '?????????????? ?????????????????? ???????????????? "?????????? ?????????? ?????????????? ??????????????????????"!');
            };
        });
        
        bot.onText(/\/setgr/, async (msg, match) => {
            const chatId = msg.chat.id;                   
           
            const user = users.find(user => user.user_id === chatId);        
            
            if(!user){
                bot.sendMessage(chatId, '???????????????????? ???? ??????????????????! \n???????????????????????? ???????????????? ???????? ??????. ?????????? (????????/?????????????????? ???????? ??????????????)');
               return; 
            };        
            
            if(!user.deviceNumber){
                bot.sendMessage(chatId, '???? ???????????? ????????????! \n????????i???? ?????????? ?????????? ??????????????. \n??????????????????: \n/addppk 703');
               return; 
            };

            try {
                const ppkState = mongoRcomConnection.db.collection('ppkState');        
                const deviceState = await getPpkState(ppkState, user.deviceNumber);
            
                if(!deviceState){
                    bot.sendMessage(chatId, `?????????????? ??????????????????! \n???? ?????????????? ???? ???????????????? ???????? ?????????????? ${user.deviceNumber}!`);
                    return;
                };        
            
                if(deviceState && deviceState.model === '4l'){
                    bot.sendMessage(chatId, '?????????????? ??????????????: ', buttonOptions4L);
                } else {
                    bot.sendMessage(chatId, '?????????????? ??????????????: ', buttonOptions8L);
                };        
            } catch (error) {
                logger.error(error);
                bot.sendMessage(chatId, '?????????????? ?????????????????? ???????????????? "?????????? ???????????? ???????????????????? ?????????????? ??????????????"!');
            };
        });
        
        bot.on('callback_query', async (msg) => {            
            const chatId = msg.from.id;    
                    
            const [ command, groupNumber ] = msg.data.split(' ');
           
            const user = users.find(user => user.user_id === chatId);
        
            if(!user){
                bot.sendMessage(chatId, '???????????????????? ???? ??????????????????! \n???????????????????????? ???????????????? ???????? ??????. ?????????? (????????/?????????????????? ???????? ??????????????)');
               return; 
            };
        
            if(!user.deviceNumber){
                bot.sendMessage(chatId, '???? ???????????? ????????????! \n????????i???? ?????????? ?????????? ??????????????. \n??????????????????: \n/addppk 703!');
               return; 
            };
        
            if(!user.deviceSerial || !user.devicePassword){
                bot.sendMessage(chatId, `?????????????? ??????????????????! \n??i??????????i ???????????????? ?????????? ???? ???????????? ??????????????! ???????? ??????????, ?????????????? ?? ?????????????? [serial]:[pass]. 
                \n??????????????????: \n/addserialpass 3389:123456`);
               return; 
            };

            try {
                const ppkState = mongoRcomConnection.db.collection('ppkState');        
                const deviceState = await getPpkState(ppkState, user.deviceNumber);
            
                if(!deviceState){
                    bot.sendMessage(chatId, `?????????????? ??????????????????! \n???? ?????????????? ???? ???????????????? ???????? ?????????????? ${user.deviceNumber}!`);
                    return;
                };
            
                // check if device is online atm 
                if(deviceState.markedAsOffline){
                    bot.sendMessage(chatId, `?????????????? ??????????????????! \n???????????? ${user.deviceNumber} ???? ?????????? ???????????? ???? ???? ????'????????!`);
                    return;
                };    
            
                // check if group exists in configuration!
                if(!deviceState.groups || !(groupNumber in deviceState.groups)){                 
                    bot.sendMessage(chatId, `?????????????? ??????????????????! \n???? ?????????????? ???? ???????????????? ?????????? ${groupNumber} ?????????????? ${user.deviceNumber}!`);
                    return;
                };
            
                const { deviceNumber, deviceSerial, devicePassword } = user;
            
                const ppkCommandQueue = mongoRcomConnection.db.collection('ppkCommandQueue');     
                   
                const result = await sendCommandToDevice(ppkCommandQueue, deviceNumber, command, groupNumber, deviceSerial, devicePassword);            
            
                bot.sendMessage(chatId, `?????????????? ${msg.data} ?????? ?????????????? ???${user.deviceNumber} ?????????????????????? ???? ????????????`);
    
                logger.info(`User "${user.first_name}, ${user.phone_number}" sent ${result}`);                
            } catch (error) {
                logger.error(error);
                bot.sendMessage(chatId, '?????????????? ?????????????????? ???????????????? "????????????????????/???????????? ???????? ??????????????"!');
            };
        });

        // terminate if token is not valid  Error: ETELEGRAM: 401 Unauthorized
        let pollingErrorsCount = 0;
        bot.on('polling_error', async (error) => {
            pollingErrorsCount++;            
            if(pollingErrorsCount === 10){
                bot.stopPolling();
                const errMsg = `Problem with Telegram Token: ${error}`;
                await createError(errMsg);                
            };
        });        
    } catch (error) {
        await createError(error);        
    };
}).on('error', async (error) => {
    await createError(error);
});