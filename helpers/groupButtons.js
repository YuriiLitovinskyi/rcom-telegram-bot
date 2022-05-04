const buttonOptions4L = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{ text: 'Поставити групу 1', callback_data: '/arm 1' }, { text: 'Зняти групу 1', callback_data: '/disarm 1' }],
            [{ text: 'Поставити групу 2', callback_data: '/arm 2' }, { text: 'Зняти групу 2', callback_data: '/disarm 2' }],
            [{ text: 'Поставити групу 3', callback_data: '/arm 3' }, { text: 'Зняти групу 3', callback_data: '/disarm 3' }],
            [{ text: 'Поставити групу 4', callback_data: '/arm 4' }, { text: 'Зняти групу 4', callback_data: '/disarm 4' }],
        ]
    })
};

const buttonOptions8L = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{ text: 'Поставити групу 1', callback_data: '/arm 1' }, { text: 'Зняти групу 1', callback_data: '/disarm 1' }],            
        ]
    })
};

module.exports = {
    buttonOptions4L,
    buttonOptions8L
};