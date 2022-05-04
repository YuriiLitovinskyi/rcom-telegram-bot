const mongoose = require('mongoose');
const { logger } = require('../helpers/logger');
const { createError } = require('../helpers/createError');

const connectDB = async (host, port, callback) => {
    try {
        const url = `mongodb://${host}:${port}/DBClientsPPK`;
        const conn = await mongoose.connect(url);

        const msg = `Connected to MongoDB, host: ${conn.connection.host}, port: ${conn.connection.port}`;
        console.log(msg.cyan);
        logger.info(msg);
        return callback(conn.connection);
    } catch (error) {
        const msgErr = `MongoDB connection error: ${error}`;
        await createError(msgErr);   
    };
};


module.exports = connectDB;