const reload = require('require-reload')(require);
const fs = require('fs');
const md5 = require("md5");
const { config } = require('process');

class Config {
    constructor() {

      this.configFile = "./config.json";
      this.configRaw = reload('./config.json');
      this.config = reload('./config.json');
    }

    replaceConfig(key, value) {
        this.config[key] = value;
    }

    replaceStrings() {
       let server = this.configRaw.server;
       for(let i in server) {
            if(typeof server[i] === "string")
                server[i] = server[i].replace(/&/g, "§")
                .replace(/%name%/g, this.config["name"])
                .replace(/%ip%/g, server["server-ip"])
                .replace(/%port%/g, server["server-port"])
                .replace(/%prefix%/g, this.config["prefix"])
        }
        this.replaceConfig("server", server);
    }
  
    reloadConfig () {
      this.configRaw = reload('./config.json');
      this.replaceStrings();
    }

    updateConfigFile() {
      fs.writeFileSync(this.configFile, JSON.stringify(this.configRaw, null, 2));
      this.reloadConfig();
    } 

    

    userHasPermission(user, permission) {
        for (let object in this.config.roles)
            if(parseInt(object) <= user.role)
                if(this.config.roles[object].permissions.includes(permission) || this.config.roles[object].permissions.includes("*"))
                    return true;
        return false;
    }

    getRoleFromId(id) {
        for (let object in this.config.roles)
            if(object == id.toString())
                return this.config.roles[object];
        return null;
    }

    startRefresh() {
        setInterval(() => {
            this.reloadConfig();
        }, 60000);
    }

    
  }

  class Users {
    constructor() {
        this.usersFile = "./users.json";
        this.users = reload('./users.json');
      }
    
    reloadUsers () {
        this.users = reload('./users.json');
    }
      
    updateUsersFile() {
        fs.writeFileSync(this.usersFile, JSON.stringify(this.users, null, 2));
        this.reloadUsers();
    }

    getUserByName(name) {
        for (let object in this.users)
            if(this.users[object].username == name)
                return this.users[object];
        return null;
    }

    getUserByID(id) {
        for (let object in this.users)
            if(object == id)
                return this.users[object];
        return null;
    }

    getUsersByRoleId(id) {
        var users = [];
        for (let object in this.users)
            if(this.users[object].role == id)
                users.push(this.users[object]);
        return users;
    }

    getUserRole(username) {
        for (let object in this.users)
            if(this.users[object].username == username)
                return this.users[object].role;
        return null;
    }

    addUser(username, password, role, expires) {
        this.users.push({
            username: username,
            password: password,
            role: role,
            expires: expires
        });
        this.updateUsersFile();
    }

    removeUser(username) {
        for (let object in this.users)
            if(this.users[object].username == username)
                this.users.splice(object, 1);
        this.updateUsersFile();
    }

    

    getUsernameFromId(id) {
        for (let object in this.users)
            if(object == id)
                return this.users[object].username;
        return null;
    }
    
    verifyPassword(username, password) {
        for (let object in this.users)
            if(this.users[object].username == username && this.users[object].password == md5(password))
                return true;
        return false;
    }

    getIdFromUsername(username) {
        for (let object in this.users)
            if(this.users[object].username == username)
                return object;
        return null;
    }

    setUserRole(username, role) {
        for (let object in this.users)
            if(this.users[object].username == username)
                this.users[object].role = role;
        this.updateUsersFile();
    }

    setUserPassword(username, password) {
        for (let object in this.users)
            if(this.users[object].username == username)
                this.users[object].password = md5(password);
        this.updateUsersFile();
    }

    setUserExpiresDate(username,date) {
        for (let object in this.users)
            if(this.users[object].username == username)
                this.users[object].expires = Math.floor(date.getTime() / 1000);
        this.updateUsersFile();
    }

    setUserLastLogin(username,ip) {
        for (let object in this.users)
            if(this.users[object].username == username)
            {
                this.users[object].lastLogin = Math.floor(Date.now() / 1000);
                this.users[object].lastIp = ip;
            }
                
        this.updateUsersFile();
    }

    isUserExpired(username) {
        for (let object in this.users)
            if(this.users[object].username == username)
                if(this.users[object].expires != null)
                    if(this.users[object].expires < Math.floor(Date.now() / 1000))
                        return true;
        return false;
    }

    startRefresh() {
        setInterval(() => {
            this.reloadUsers();
        }, 60000);
    }

  }

  
  
  module.exports = {
    Config,
    Users
  };