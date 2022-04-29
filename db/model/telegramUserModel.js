const mongoose = require('mongoose');

const telegramUserSchema = mongoose.Schema({
    phone_number: {
        type: String,
        required: [true, 'Please add phone number']
    },
    user_id: {
        type: Number,
        required: [true, 'Please add user chat id']
    },
    first_name: String,
    deviceNumber: Number
}, {
    timestamps: true
});

module.exports = mongoose.model('rcomTelegramBotUsers', telegramUserSchema);