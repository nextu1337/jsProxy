const fs = require('fs');
const reload = require('require-reload')(require);
class PluginManager {
    constructor(server, config, users, logger) {
        this.server = server;
        this.config = config;
        this.users = users;
        this.logger = logger;
        this.serverPlugins = {};
        this.clientPlugins = {};
        this.targetClientPlugins = {};
        this.pluginShortNamesAndFileNames = {};
    }

    load(plugin) {
        if (plugin.type == "client")
            return this.clientPlugins[plugin.shortName] = plugin;
        if (plugin.type == "server")
            return this.serverPlugins[plugin.shortName] = plugin;
        return this.targetClientPlugins[plugin.shortName] = plugin;
    }
    
    reloadPlugin(shortName) {
        if (this.serverPlugins[shortName]) {
            let Plugin = reload("./plugins/" + this.pluginShortNamesAndFileNames[shortName]);
            this.serverPlugins[shortName] = new Plugin(this.server, this.config, this.users, this.logger);
            return true
        }
        if (this.clientPlugins[shortName]) {
            let Plugin = reload("./plugins/" + this.pluginShortNamesAndFileNames[shortName]);
            this.clientPlugins[shortName] = new Plugin(this.server, this.config, this.users, this.logger);
            return true
        }
        if (this.targetClientPlugins[shortName]) {
            let Plugin = reload("./plugins/" + this.pluginShortNamesAndFileNames[shortName]);
            this.targetClientPlugins[shortName] = new Plugin(this.server, this.config, this.users, this.logger);
            return true;
        }
        return false;
    }



    getPlugins() {
        let plugins = [];
        for (let plugin in this.serverPlugins)
            plugins.push(this.serverPlugins[plugin].getName() + ` (${this.serverPlugins[plugin].getShortName()})`);
        for (let plugin in this.clientPlugins)
            plugins.push(this.clientPlugins[plugin].getName() + ` (${this.clientPlugins[plugin].getShortName()})`);
        for (let plugin in this.targetClientPlugins)
            plugins.push(this.targetClientPlugins[plugin].getName() + ` (${this.targetClientPlugins[plugin].getShortName()})`);
        return plugins;
    }

    getPluginInfo(shortName) {
        if (this.serverPlugins[shortName])
            return this.serverPlugins[shortName].getInfo();
        if (this.clientPlugins[shortName])
            return this.clientPlugins[shortName].getInfo();
        if (this.targetClientPlugins[shortName])
            return this.targetClientPlugins[shortName].getInfo();
        return null;
    }

    loadPlugins() {
        let files = fs.readdirSync("./plugins");
        for (let file of files) {
            if (file.endsWith(".js")) {
                let Plugin = reload("./plugins/" + file);
                let plg = new Plugin(this.server, this.config, this.users, this.logger)
                this.pluginShortNamesAndFileNames[plg.shortName] = file;
                this.load(plg); 
            }
        }
    }

}

module.exports = PluginManager;