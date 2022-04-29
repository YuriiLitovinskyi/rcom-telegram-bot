const UserModel = require('./model/telegramUserModel');

// check for new documents in RCOM Journal collections
function readJournal(connection){
    return new Promise((resolve, reject) => {
        try {            
            const collection = connection.db.collection('Journal');
            const currentDate = new Date().toISOString();
            
            collection.find({date_time: { $gte: currentDate }}).toArray((err, data) => {
                if(err) reject(err);

                resolve(data);
            });
        } catch (error) {
            reject(error);
        };
    });
};

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

function deleteUser(chatId, firstName){
    return new Promise(async (resolve, reject) => {
        try {
            const res = await UserModel.deleteOne({ user_id: chatId });

            resolve(`User "${firstName}, id: ${chatId}" unsubscribed!`);
        } catch (error) {
            reject(error);
        };
    });
};

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
    registerUser,
    updateDevice,
    deleteUser,
    findAllUsers
};