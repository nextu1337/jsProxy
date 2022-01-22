const { ServerPlugin } = require( '../pluginAPI' );

class Server extends ServerPlugin {
    constructor(server,config,users,logger) {
        super(server,config,users,logger);
    }
    name = "Server";
    shortName = "srv";
    description = "Helps with basic server things.";
    author = "nextu";

    onEnd(client, reason) {
        if(client?.loggedIn)
            this.broadcast(`§9§l[LOGOUT] §r§3${client.username} §9has logged out.`,"all");
        this.logger.info(`${client.username} (${client.addr}) has disconnected. (${reason})`);
    }
    onJoin(client) {
        this.logger.info(`${client.username} (${client.addr}) has connected.`);
        if(this.users.getUserByName(client.username) == null)
        {
            client.end("§cYou are not registered on this proxy. Please contact an administrator.");
            return this.logger.error(`${client.username} (${client.addr}) was kicked. (Not registered)`);
        }
        if(this.users.isUserExpired(client.username))
        {
            client.end("§cYour account has expired. Please contact an administrator.");
            return this.logger.error(`${client.username} (${client.addr}) was kicked. (Expired)`);
        }
        client.loggedIn = false;
        this.broadcast('§3Login using §9'+this.config.config.prefix+'login <password> §3to begin.', client);
        
    }

    onCommand(client, cmd, args) {
    
        switch(cmd)
        {
            case "l":
            case "login":
                if(!this.config.userHasPermission(this.users.getUserByName(client.username),"login")) return;
                if(args.length == 0)
                    return this.broadcast("§cUsage: §9"+this.config.config.prefix+"login <password>",client);
                if(!this.users.verifyPassword(client.username,args[0]))
                {
                    client.loggedIn = false;
                    return this.broadcast("§cWrong password.",client);
                }
                this.logger.info("User "+client.username+" logged in.");
                this.broadcast(`§9§l[LOGIN] §r§3${client.username} §r§9has logged in.`,"all");
                client.loggedIn = true;
                this.broadcast(`§aYou are now logged in.`,client);
                let date = new Date(this.users.getUserByName(client.username).expires*1000)
                this.broadcast('§3Access expiration date: '+(date.getMonth()+1)+'/'+date.getDate()+'/'+date.getFullYear()+' '+date.getHours().toString().padStart(2, "0")+':'+date.getMinutes().toString().padStart(2, "0")+':'+date.getSeconds().toString().padStart(2, "0"),client)
                break;
            case "help":
                if(!client.loggedIn) return this.broadcast(this.config.config.notLoggedIn,client);
                this.broadcast(`§9${this.config.config.prefix}login <password> §3- §9Login to the proxy.`,client);
                this.broadcast(`§9${this.config.config.prefix}help §3- §9Shows this message.`,client);
                break;
        }
    }
}

module.exports = Server;