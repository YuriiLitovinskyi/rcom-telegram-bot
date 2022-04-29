const mongoose = require('mongoose');
const sleep = require('../helpers/sleep');

const connectDB = async (host, port, callback) => {
    try {
        const url = `mongodb://${host}:${port}/DBClientsPPK`;
        const conn = await mongoose.connect(url);

        console.log(`Connected to MongoDB, host: ${conn.connection.host}, port: ${conn.connection.port}`.cyan);
        return callback(conn.connection);
    } catch (error) {      
        console.log(`Error: ${error}`.red);
        console.log('Application will be closed in 20 seconds');
        await sleep(20000);
        process.exit(1);
    };
};


module.exports = connectDB;