const express = require('express');
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const colors = require('colors');

const sleep = require('./helpers/sleep');
const connectDb = require('./db/db');
const { readJournal, registerUser, updateDevice, deleteUser, findAllUsers } = require('./db/methods');
const { convertIdMessage, convertLineMessage, enabledStatus } = require('./helpers/messages');

const app = express();

const version = '1.0.0';
console.log(`ver: ${version}`.grey);
const serverPort = process.env.SERVER_PORT || 4622;
const mongoHost = process.env.MONGO_HOST || 'localhost';
const mongoPort = process.env.MONGO_PORT || 27017;
const TELEGRAM_TOKEN =  process.env.TELEGRAM_API_TOKEN;  // check if exists
const timer = 1000; // timer for checking new inserts in collection Journal
let users;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

connectDb(mongoHost, mongoPort, async (connection) => {
    users = await findAllUsers();
    console.log(users);
    setInterval(async () => {
        let journalData = await readJournal(connection);
        //console.log('Journal: ', journalData);

        // array of devices!!! or all updated LATEST users and devices!
        for(let i = 0; i < users.length; i++){
            for(let j = 0; j < journalData.length; j++){
                if(users[i].deviceNumber === journalData[j].ppk_num){                   
                    bot.sendMessage(users[i].user_id, `${convertIdMessage( journalData[j].id_msg)} ${journalData[j].line && convertLineMessage(journalData[j].line)}`);
                };
            };
        };

        data = null;            
    }, timer);
});


//2 

// const buttonOptions = {
//     reply_markup: JSON.stringify({
//         inline_keyboard: [
//             [{ text: 'Send', callback_data: '/addDevice' }]
//         ]
//     })
// };       


bot.setMyCommands([
    { command: '/start', description: 'Register user phone and device' },
    { command: '/stop', description: 'Delete all user data and stop notif' },
    // { command: '/addDevice', description: 'Add device for notif' }, // error
    { command: '/about', description: 'About bot' },
]);

// bot.on('message', (msg) => {
//     //console.log(msg);
//     const text = msg.text;
//     const chatId = msg.chat.id;

//     //bot.sendMessage(chatId, text);
// });

bot.onText(/\/start/, (msg, match) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, 'Please share your phone number for registration!');
});

bot.onText(/\/stop/, async (msg, match) => {
    const chatId = msg.chat.id;
    const firstName = msg.chat.first_name;                

    const result = await deleteUser(chatId, firstName);
    console.log(result.yellow);

    bot.sendMessage(chatId, 'User data deleted! Notifications are turned off!');
    //bot.stopPolling();
});

bot.onText(/\/about/, async (msg, match) => {
    const chatId = msg.chat.id;

    await bot.sendMessage(chatId, 'This bot will send events to user from his security device');
});

bot.onText(/\/addDevice (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const deviceNumber = match[1];

    if(!parseInt(deviceNumber) || !Number.isInteger(+deviceNumber) || +deviceNumber <= 0){                    
        await bot.sendMessage(chatId, 'Error! Please add an integer number!');
    } else {
        const result = await updateDevice(+deviceNumber, chatId);
        console.log(result.green);

        users = await findAllUsers();

        await bot.sendMessage(chatId, `Success! Notifications for device ${deviceNumber} are on!`);
    };

});

bot.on('contact', async (msg) => {
    const user = msg.contact;
    const chatId = msg.chat.id;

    const result = await registerUser(user);
    console.log(result.green);               

    await bot.sendMessage(chatId, 'Phone number registered succesfully!');
    users = await findAllUsers();
    await bot.sendMessage(chatId, 'Enter your device number! \nFor example: /addDevice 703');

    //bot.sendMessage(chatId, 'Enter your device number: ', buttonOptions);

});

// bot.on('callback_query', msg => {
//     console.log(msg.data)
// });


app.listen(serverPort, async () => {
 
    console.log(`Server started on port ${serverPort}`.cyan);
    try { 
        
        
        
    } catch (err) {
        console.log(`Error: ${err}`.red);
        console.log('Application will be closed in 20 seconds');
        await sleep(20000);
        process.exit(1);
    };
}).on('error', async (err) => {
    console.log(`Error: ${err.message}`.red);
    console.log('Application will be closed in 20 seconds');
    await sleep(20000); 
});
