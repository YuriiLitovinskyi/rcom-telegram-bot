const log4js = require("log4js");

log4js.configure({
    appenders: { rcombot: { type: "file", filename: "rcombot.log" } },
    categories: { default: { appenders: ["rcombot"], level: "info" } }
});

const logger = log4js.getLogger("rcombot");

module.exports = { logger };