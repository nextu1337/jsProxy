// Requires

const mc = require('minecraft-protocol');
const database = require("./config.js");
const PluginManager = require("./pluginManager.js");
const Logger = require('./logger.js');

// Variables

const config = new database.Config();
const users = new database.Users();
const logger = new Logger()
const states = mc.states;
let settings = config.config;
let proxyClients = {};

// Code

config.reloadConfig();
users.reloadUsers();


// Create proxy server
const proxyServer = mc.createServer({ 
	'online-mode': 	settings.server["online-mode"],
	'motd': 		settings.server["motd"],
	'max-players': 	settings.server["max-players"],
	'port': 		settings.server["port"],
	'version': 		settings.server["version"],
	'encryption': 	true
});

const mcData = require('minecraft-data')(proxyServer.version)

// Refresh every 60 seconds
logger.startIntervals();
config.startRefresh();
users.startRefresh();
setInterval(() => { settings = config.config }, 60000);

const pluginManager = new PluginManager(proxyServer, config, users, logger);
	  pluginManager.loadPlugins();


// Events
proxyServer.on('listening', function() {
	logger.success(`Server works fine! Listening on port ${proxyServer.socketServer.address().port}`);
	for(let i in pluginManager.serverPlugins) 		{    pluginManager.serverPlugins[i].load()    }
	for(let i in pluginManager.clientPlugins) 		{    pluginManager.clientPlugins[i].load()    }
    for(let i in pluginManager.targetClientPlugins) { pluginManager.targetClientPlugins[i].load() }
})

proxyServer.on('login', function(client) {
	client['addr'] = client.socket.remoteAddress;
	loginAndPosition(client);
	for (let i in pluginManager.serverPlugins) { pluginManager.serverPlugins[i].onJoin(client) }
	for (let i in pluginManager.clientPlugins) { pluginManager.clientPlugins[i].onJoin(client) }
	
	client.on('chat', (data) => handleChat(client, data));
	client.on('end', (reason) => {
		for (let i in pluginManager.serverPlugins) {pluginManager.serverPlugins[i].onEnd(client);}
		for (let i in pluginManager.clientPlugins) {pluginManager.clientPlugins[i].onEnd(client);}
	})
});

function broadcast(message, to) {
	let client
	for (const clientId in proxyServer.clients) {
		if (proxyServer.clients[clientId] === undefined || (!proxyServer.clients[clientId].loggedIn && to == "all")) continue

		client = proxyServer.clients[clientId]
		if (client == to || to == "all") {
			const msg = {
				text: message,
			}
		}
	}
}

function handleChat(client, data) {
	if (data.message.startsWith(settings.prefix)) {
		let msg = data.message.substring(settings.prefix.length);
		let args = msg.split(" ");
		let cmd = args.shift();
		handleCommand(client, cmd, args);
		for (let i in pluginManager.clientPlugins) {pluginManager.clientPlugins[i].onCommand(client, cmd, args);}
		for (let i in pluginManager.serverPlugins) {pluginManager.serverPlugins[i].onCommand(client, cmd, args);}
		return;
	}
	for (let i in pluginManager.serverPlugins) {pluginManager.serverPlugins[i].onChat(client, data);}
	for (let i in pluginManager.clientPlugins) {pluginManager.clientPlugins[i].onChat(client, data);}
	return;
}

function handleCommand(client, cmd, args) {
	if (!client.loggedIn && cmd != "login" && cmd != "l")
		return broadcast("§cYou are not logged in.", client);
	switch (cmd) {
		case "connect":
			if (!config.userHasPermission(users.getUserByName(client.username), "connect")) return;
			if (args.length == 0)
				return broadcast("§cYou must specify a server.", client);
			if(client["controllingId"]=="") return client.end("§cYou've been kicked.\nThe reason why is simple.\nThere is a bug that sends packets 2x times if you connect for the second time.\nFix hasn't been found yet");
			targetServer = args[0].includes(":") ? args[0].split(":") : [args[0], 25565];
			username = args[1] || client.username;
			proxy = args[2] || null;
			startBot(client, targetServer, username, proxy);
			break;
		case "leave":
			if (proxyClients[client["controllingId"]] == null)
				return broadcast("§cYou are not connected to a server.", client);
			safelyLeave(client);
			break;
		case "pl":
		case "plugins":
			if (!config.userHasPermission(users.getUserByName(client.username), "plugins")) return;
			if(args.length == 0) {
				let plugins = pluginManager.getPlugins();
				let pluginList = "";
				for (let i in plugins) {
					pluginList += "§a" + plugins[i] + "§f, ";
				}
				pluginList = pluginList.substring(0, pluginList.length - 2);
				client.write("chat", {
					message: JSON.stringify(`§fPlugins (${plugins.length}): ` + pluginList)
				});
				break;
			}
			if(args[0] == "reload") {
				if (!config.userHasPermission(users.getUserByName(client.username), "plugins.reload")) return;
				if(args.length==1) 
				{
					pluginManager.loadPlugins();
					client.write("chat", {
						message: JSON.stringify("§aPlugins reloaded.")
					});
				}
				if(pluginManager.reloadPlugin(args[1]))
					client.write("chat", {
						message: JSON.stringify("§a" + pluginManager.getPluginInfo(args[1]).name + " reloaded.")
					});
			}	
			if(args[0] == "info") {
				if (!config.userHasPermission(users.getUserByName(client.username), "plugins.help")) return;
				if(args.length==1) return client.write("chat", {message: JSON.stringify("§cSpecify a plugin to get information on it.")});
				let plugin = pluginManager.getPluginInfo(args[1]);
				if(plugin == null) return client.write("chat", {message: JSON.stringify("§cPlugin not found.")});
				client.write("chat", {
					message: JSON.stringify(`§fName: §a${plugin.name}\n§fVersion: §a${plugin.version}\n§fAuthor: §a${plugin.author}\n§fDescription: §a${plugin.description}`)
				});
			}
			break;
	}
}

function startBot(client, targetServer, username, proxy) {
	id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
	client["controllingId"] = id;
	client["endedTargetClient"] = false;
	client["endedClient"] = false;
	proxyClients[id] = mc.createClient({
		host: targetServer[0],
		port: targetServer[1],
		username: username,
		keepAlive: false,
		version: proxyServer.version,
	})
	client["controlling"] = proxyClients[id];
	proxyClients[id].on('connect',()=>{
		client["connectedTo"] = targetServer.join(":");
		for (let i in pluginManager.clientPlugins) {pluginManager.clientPlugins[i].onConnect(client,targetServer.join(":"),proxy);}	
	})
	proxyClients[id].on('packet', function(data, meta) {
		if (meta.state === states.PLAY && client.state === states.PLAY) {
			for (let i in pluginManager.targetClientPlugins) {pluginManager.targetClientPlugins[i].onPacket(proxyClients[id], data, meta)}
			for (let i in pluginManager.clientPlugins) {pluginManager.clientPlugins[i].onTargetClientPacket(client, proxyClients[id], data, meta)}	
      if (meta.name == "kick_disconnect") {
        for (let i in pluginManager.targetClientPlugins) {pluginManager.targetClientPlugins[i].onEnd(proxyClients[id], reason)}
				broadcast("§cYou have been kicked from the server.", client);
				client.write('chat', {
					message: data.reason,
					position: 0,
				})
				return safelyLeave(client);
			}
			if (!client["endedClient"]) {
				client.write(meta.name, data)
				if (meta.name === 'set_compression') {
					client.compressionThreshold = data.threshold
				}
			}
		}
	})
	proxyClients[id].on('raw', function(buffer, meta) {
		if (client.state !== states.PLAY || meta.state !== states.PLAY) return
    if(proxyClients[id] == null || proxyClients[id] === undefined) return;  
		const packetData = proxyClients[id].deserializer.parsePacketBuffer(buffer).data.params
		const packetBuff = client.serializer.createPacketBuffer({
			name: meta.name,
			params: packetData
		})
	})
	
	proxyClients[id].on('end', function(reason) {
		client["endedTargetClient"] = true
		for(let i in pluginManager.targetClientPlugins) {pluginManager.targetClientPlugins[i].onEnd(proxyClients[id], reason)}
		console.log('Connection closed by server', '(' + client.socket.remoteAddress + ')')
		broadcast("§cYou've been kicked.", client);
		client.write('chat',{message: JSON.stringify(reason)})
		safelyLeave(client);
})
	proxyClients[id].on('error', function(err) {
		client["endedTargetClient"] = true
		for(let i in pluginManager.targetClientPlugins) {pluginManager.targetClientPlugins[i].onError(proxyClients[id], err)}
		safelyLeave(client);
	})
		client.on('packet', function(data, meta) {
			if (proxyClients[id]?.state === states.PLAY && meta.state === states.PLAY) {
				if (meta.name == "chat" && (data.message.startsWith(settings.ircPrefix) || data.message.startsWith(settings.prefix))) return;
				for (let i in pluginManager.clientPlugins) {pluginManager.clientPlugins[i].onPacket(client, data, meta)}
				if (!client["endedTargetClient"]) proxyClients[id].write(meta.name, data)
			}
		})
		client.on('raw', function(buffer, meta) {
			if (meta.state !== states.PLAY || proxyClients[id]?.state !== states.PLAY) return;
			if (client["endedTargetClient"]) return;
		if(proxyClients[id] == null || proxyClients[id] === undefined) return;  
			const packetData = client.deserializer.parsePacketBuffer(buffer).data.params
			const packetBuff = proxyClients[id]?.serializer.createPacketBuffer({name: meta.name,params: packetData})
		})
}


function safelyLeave(client) {
	if(client["controllingId"] == "") return;
	client["endedTargetClient"] = true ; client["endedClient"] = true;
	proxyClients[client["controllingId"]]?.end();
	proxyClients[client["controllingId"]]?.removeAllListeners();
	proxyClients[client["controllingId"]] = undefined;
	client["controllingId"] = "" ; loginAndPosition(client);
}

function loginAndPosition(client) {

	client.write('login', {
		entityId: client.id,
		levelType: 'default',
		gameMode: 2,
		dimension: 0
	});
	client.write('position', {
		x: 1337.420,
		y: 70,
		z: 1337.420,
		yaw: 0,
		pitch: 0,
		flags: 0x00
	});
}