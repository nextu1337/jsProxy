const fs = require('fs');
const loggerStartTime = new Date().getTime();

class Logger {
    constructor() {
        this.logs = [];
        this.ircLogs = [];
        this.logIRChat = true;
    }
    
    success(message) {
        console.log("\x1b[32m[S] " + message);
        this.log(new Date().toUTCString() + " [S] " + message);
    }

    error(message) {
        console.log("\x1b[31m[X] " + message);
        this.log(new Date().toUTCString() + " [X] " + message);
    }

    info(message) {
        console.log("\x1b[34m[i] " + message);
        this.log(new Date().toUTCString() + " [i] " + message);
    }

    log(message) {
        this.logs.push(message);
    }

    logIRC(username,message) {
        if(this.logIRChat) console.log(`\x1b[34m[IRC] \x1b[32m${username}\x1b[34m: ${message}`);
        this.ircLogs.push(new Date().toUTCString() + ` ${username}: ${message}`);
    }
    
    getLogs() {
        return this.logs;
    }

    getIRCLogs() {
        return this.ircLogs;
    }

    clearLogs() {
        this.logs = [];
    }

    clearIRCLogs() {
        this.ircLogs = [];
    }

    getLogsAsString() {
        return this.logs.join("\n");
    }
    
    getIRCLogsAsString() {
        return this.ircLogs.join("\n");
    }

    saveIRCLogs() {
        fs.writeFileSync("./logs/irc/latest.txt", this.getIRCLogsAsString());
        this.saveIRCLogsToFile(loggerStartTime);
    }

    saveIRCLogsToFile(fileName) {
        fs.writeFileSync("./logs/irc/" + fileName + ".txt", this.getIRCLogsAsString());
    }

    saveLogs() {
        fs.writeFileSync("./logs/latest.txt", this.getLogsAsString());
        this.saveLogsToFile(loggerStartTime);
    }

    saveLogsToFile(fileName) {
        fs.writeFileSync("./logs/" + fileName + ".txt", this.getLogsAsString());
    }

    startIntervals() {
        setInterval(() => {
            this.saveLogs();
        }, 60000);
        setInterval(() => {
            this.saveIRCLogs();
        }, 60000);
    }

}

module.exports = Logger;