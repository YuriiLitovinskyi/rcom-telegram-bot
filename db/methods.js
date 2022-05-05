const UserModel = require('./telegramUserModel');

// @collection Journal
// check for new documents in RCOM Journal collection
function readJournal(journal, timer){
    return new Promise(async (resolve, reject) => {
        try {       
            const currentDate = new Date(Date.now() - timer - 3000);       
                     
            await journal.find({date_time: { $gte: currentDate }}).toArray((err, data) => {
                if(err) reject(err);

                resolve(data);
            });
        } catch (error) {
            reject(error);
        };
    });
};

/**
 * Initialize all docs in collection Journal to "isSentTelBot: true" in the beginning. It is needed to avoid spam messages to users!
 * @param {*} journal - RCOM collection
 * @returns {promise}
 * @collection Journal
*/
function updateJournalCollection(journal){
    return new Promise(async (resolve, reject) => {
        try {
            const count = await journal.count();         
            await journal.updateMany({}, { $set: { isSentTelBot: true } });
            resolve(`RCOM Journal collection: updated ${count} documents`);
        } catch (error) {
            reject(error);
        };
    });
};

// @collection Journal
function updateJournalDoc(journal, _id){
    return new Promise(async (resolve, reject) => {
        try {
            await journal.updateOne({ _id }, { $set: { isSentTelBot: true } });
            resolve(`Journal single document ${_id} updated`);
        } catch (error) {
            reject(error);
        };
    });
};

// @collection ppkState
function getPpkState(ppkState, ppk_num){
    return new Promise(async (resolve, reject) => {
        try {
            const currendDeviceState = await ppkState.findOne({ ppk_num });

            resolve(currendDeviceState);
        } catch (error) {
            reject(error);
        };
    });
};

// @collection ppkCommandQueue
// Send arm/disarm device groups
function sendCommandToDevice(ppkCommandQueue, ppk_num, user_command, group_num, serial_num, ppk_pass){
    return new Promise(async (resolve, reject) => {
        try {
            let command;
            user_command === '/arm' ? command = 'ON' : command = 'OFF';

            await ppkCommandQueue.insertOne({
                ppkNum : ppk_num,
                message: "TASK",
                time: Date.now(),
                task: `GROUP${group_num}_${command}`,   
                mobileKey: serial_num.toString(),
                password: ppk_pass.toString()
            });

            resolve(`Command "${user_command} ${group_num}" to device number "${ppk_num}"`);
        } catch (error) {
            reject(error);
        };
    });
};


// @collection: rcomtelegrambotusers
function registerUser(userData){
    return new Promise(async (resolve, reject) => {
        try {
            await UserModel.findOneAndUpdate({
                phone_number: userData.phone_number
            }, {
                $set: userData
            }, { 
                upsert: true, 
                returnNewDocument: true  
            });

            resolve(`User "${userData.first_name}, ${userData.phone_number}" registered!`);                
        } catch (error) {
            reject(error);
        };
    });
};

// @collection: rcomtelegrambotusers
function updateDevice(deviceNumber, chatId){     
    return new Promise(async (resolve, reject) => {
        try {
            const user = await UserModel.findOneAndUpdate({
                user_id: chatId
            }, {
                $set: {
                    deviceNumber
                }
            }, { 
                upsert: false, 
                returnNewDocument: true  
            });

            resolve(`User "${user.first_name}, ${user.phone_number}" subscribed on device "${deviceNumber}"!`);                 
        } catch (error) {
            reject(error);
        };
    });
};

// @collection: rcomtelegrambotusers
function updateDeviceSerialPass(deviceSerial, devicePassword, chatId){     
    return new Promise(async (resolve, reject) => {
        try {
            const user = await UserModel.findOneAndUpdate({
                user_id: chatId
            }, {
                $set: {
                    deviceSerial,
                    devicePassword
                }
            }, { 
                upsert: false, 
                returnNewDocument: true  
            });
            resolve(`User "${user.first_name}, ${user.phone_number}" added ppk serial "${deviceSerial}" and ppk password "${devicePassword}"!`);                
            
        } catch (error) {
            reject(error);
        };
    });
};

// @collection: rcomtelegrambotusers
function deleteUser(chatId){
    return new Promise(async (resolve, reject) => {
        try {
            const res = await UserModel.findOneAndRemove({ user_id: chatId });  // findOneAndRemove  // findOneAndDelete - for mongoose ver ^5.x          

            resolve(`User "${res.first_name}, ${res.phone_number}" unsubscribed! All user data deleted!`);
        } catch (error) {            
            reject(error);
        };
    });
};

// @collection: rcomtelegrambotusers
function findAllUsers(){
    return new Promise(async (resolve, reject) => {
        try {
            const users = await UserModel.find({});

            resolve(users);
        } catch (error) {
            reject(error);
        };
    });
};

module.exports = {     
    readJournal,
    updateJournalCollection,
    updateJournalDoc,
    getPpkState,
    sendCommandToDevice,
    registerUser,
    updateDevice,
    updateDeviceSerialPass,
    deleteUser,
    findAllUsers    
};