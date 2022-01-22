class plugin {
  constructor() {

  }
    name = "Unnamed";
    shortName = "unmd";
    description = "No description";
    version = "0.0.0"
    author = "Unknown";

    getName() { return this.name; }
    getShortName() { return this.shortName; }
    getDescription() { return this.description; }
    getVersion() { return this.version; }
    getAuthor() { return this.author; }
    getInfo() { return { name: this.name, shortName: this.shortName, description: this.description, version: this.version, author: this.author }; }
}

class TargetClientPlugin extends plugin {
    constructor(server,config,users,logger) {
        super();
        this.server = server;
        this.config = config;
        this.users = users;
        this.logger = logger;
    }

    type = "targetClient";
    load(tclient) { }
    unload(tclient) { }
    onChat(tclient, data) { }
    onJoin(tclient, data) { }
    onPacket(tclient, data, meta) { }
    onEnd(tclient, reason) { }
    onError(tclient, err) { }

}

class ClientPlugin extends plugin {
  constructor(server,config,users,logger) {
    super();
    this.server = server;
    this.config = config;
    this.users = users;
    this.logger = logger;
}


    type = "client";
    load(client) { }
    unload(client) { }
    onCommand(client, cmd, args) { }
    onJoin(client) { }
    onPacket(client, data, meta) { }
    onTargetClientPacket(client, targetClient, data, meta) { }
    onChat(client, data) { }
    onEnd(client, reason) { }
    onConnect(client, server, proxy) { }

}

class ServerPlugin extends plugin {
    constructor(server,config,users,logger) {
        super();
        this.server = server;
        this.config = config;
        this.users = users;
        this.logger = logger;
    }
  
    type = "server";
    load() { }
    unload() { }
    onJoin(client) { }
    onEnd(client, reason) { }
    onChat(client, data) { }
    onCommand(client, cmd, args) { }

    broadcast (message, to) {
        let client
        for (const clientId in this.server.clients) {
          if (this.server.clients[clientId] === undefined || (!this.server.clients[clientId]?.loggedIn && to=="all")) continue
        
          client = this.server.clients[clientId]
          if (client == to || to=="all") {
            const msg = {
             text: message,
            }
            client.write('chat', {
              message: JSON.stringify(msg),
              position: 0,
            })
          }
        }
      }
}

module.exports = {
    plugin,
    TargetClientPlugin,
    ClientPlugin,
    ServerPlugin
}