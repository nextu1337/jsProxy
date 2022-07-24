const { ServerPlugin } = require( '../pluginAPI' );

class IRC extends ServerPlugin {
    constructor(server,config,users,logger) {
        super(server,config,users,logger);
    }
    name = "IRC";
    shortName = "irc";
    description = "Allows proxy users to communicate";
    version = "1.0";
    author = "nextu";

    onCommand(client, cmd, args) {
        if(cmd=="help")
            return this.broadcast(`§9${this.config.config.ircPrefix}message §3- §9Sends an IRC message.`,client);
    }
    

    onChat(client, data) {
        let message = data.message;
        if(message.startsWith("#")){
            if(!this.config.userHasPermission(this.users.getUserByName(client.username),"irc"))
                return this.broadcast("§cYou do not have permission to use IRC.",client);
            if(!client?.loggedIn) 
                return this.broadcast("§cYou are not logged in.",client);
            if(message.length == 0)
                return this.broadcast("§cMessage cannot be empty.",client);
            if(message.length > 100)
                return this.broadcast("§cMessage cannot be longer than 100 characters.",client);
            message = message.substring(this.config.config.ircPrefix.length)
            this.logger.logIRC(client.username,message);
            let role = this.config.getRoleFromId(this.users.getUserRole(client.username))
            return this.broadcast(`§9§l[IRC] §r§9${role.prefix}${client.username}§r§9: §3${role.color}${message}`,"all");
        }

    }
}

module.exports = IRC;
