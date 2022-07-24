// Requires

const mc = require('minecraft-protocol');
const database = require("./config.js");
const PluginManager = require("./pluginManager.js");
const Logger = require('./logger.js');
const { Packet } = require('./pluginAPI.js');

// Variables

const config = new database.Config();
const users = new database.Users();
const logger = new Logger()
const states = mc.states;
let settings = config.config;
let proxyClients = [];

// Code

config.reloadConfig();
users.reloadUsers();


// Create proxy server
const proxyServer = mc.createServer({ 
	'online-mode': 	false,
	'motd': 		settings.server["motd"],
	'max-players': 	settings.server["max-players"],
	'port': 		settings.server["port"],
	'version': 		settings.server["version"],
	'encryption': 	true
});

// Refresh every 60 seconds
logger.startIntervals();
config.startRefresh();
users.startRefresh();
setInterval(() => { settings = config.config }, 60000);

proxyServer.startBot = startBot;

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
	client["controllingId"] = "";
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
			const msg = JSON.stringify(message);
			if(to == "all") 
			{
				for(o of proxyServer.clients) 
					if(o?.loggedIn)
						o.write('chat', {message:msg});
				return;
			}
			client.write('chat', {message:msg});
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
		case "conn":
		case "join":
		case "connect":
			if (!config.userHasPermission(users.getUserByName(client.username), "connect")) return;
			if (args.length == 0)
			{
				broadcast("§cCorrect usage: connect <server[:port]> [username].", client);
				return broadcast("§cYou must specify a server.", client);
			}
				
			targetServer = args[0].includes(":") ? args[0].split(":") : [args[0], 25565];
			username = args[1] || client.username;
			proxy = args[2] || null;
			startBot(client, targetServer, username, proxy);
			broadcast("§aConnecting to "+targetServer.join(":")+" as "+username,client);
			break;
		case "l":
			if(!client.loggedIn) return;
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

function startBot(client, targetServer, username, params) {
	let id = proxyClients.length;
	params = params || [];
	if(client["controllingId"] != "") return broadcast("§3Already connected to a server!",client);
	client["controllingId"] = id;
	console.log(client.controllingId);
	proxyClients[id] = mc.createClient({
		host: targetServer[0],
		port: targetServer[1],
		username: username,
		skipValidation:true,
		keepAlive: false,
		version: proxyServer.version,
	})
	client["controlling"] = proxyClients[id];
	proxyClients[id]["ended"] = false;
	client["endedClient"] = false;
	proxyClients[id].on('connect',()=>{
		client["connectedTo"] = targetServer.includes(":")?targetServer.join(":"):targetServer;
		for (let i in pluginManager.clientPlugins) {pluginManager.clientPlugins[i].onConnect(client,targetServer,params);}	
	})
	proxyClients[id].on('packet', function(data, meta) {
		if (!(meta.state === states.PLAY && client.state === states.PLAY)) return;
		let packet = new Packet(client,"toClient",meta,data);
			for (o in pluginManager.targetClientPlugins) {pluginManager.targetClientPlugins[o].onPacket(proxyClients[id], packet)}
			for (o in pluginManager.clientPlugins) {pluginManager.clientPlugins[o].onTargetClientPacket(client, proxyClients[id], packet)}	
      		if (meta.name == "login") return;
			if (meta.name == "kick_disconnect" || meta.name== "disconnect") {
				for (o in pluginManager.targetClientPlugins) {pluginManager.targetClientPlugins[o].onEnd(proxyClients[id], data.reason)}
				for (o in pluginManager.clientPlugins) {pluginManager.clientPlugins[o].onTargetClientEnd(client,proxyClients[id], data.reason)}
				broadcast("\n\n§cYou have been kicked from the server.", client);
				client.write('title',{action:0,text: JSON.stringify({text: "§4Kicked."})})
				client.write('chat', {message: data.reason,position: 0,});
				return safelyLeave(client);
			}
			if (client["endedClient"]) return;
			if(client?.cancelEvent && client.cancelEvent.type=="toClient" && client.cancelEvent.name==meta.name && client.cancelEvent.data==data) return client.cancelEvent = null;
			client.write(meta.name, packet.dataMod);
			if (meta.name === 'set_compression') client.compressionThreshold = data.threshold
	})
	proxyClients[id].on('end', function(reason) {
		for(o in pluginManager.clientPlugins) {pluginManager.clientPlugins[o].onTargetClientEnd(proxyClients[id], reason)}
		client.write('chat',{message: JSON.stringify(reason)})
		safelyLeave(client);
	})
	proxyClients[id].on('error', function(err) {
		for(o in pluginManager.targetClientPlugins) {pluginManager.targetClientPlugins[o].onError(proxyClients[id], err)}
		console.error(err);
		safelyLeave(client);
	})
	client.on('packet', function(data, meta) {
		if (!(proxyClients[id]?.state === states.PLAY && meta.state === states.PLAY)) return;
		let packet = new Packet(client,"toServer",meta,data);
		for (o in pluginManager.clientPlugins) {pluginManager.clientPlugins[o].onPacket(client, packet)}
		if(client?.cancelEvent && client.cancelEvent.type=="toServer" && client.cancelEvent.name==meta.name && client.cancelEvent.data==data) return client.cancelEvent = null;
		if (meta.name == "chat" && (data.message.startsWith(settings.ircPrefix) || data.message.startsWith(settings.prefix))) return;
		if (!proxyClients[id]["ended"]) proxyClients[id].write(meta.name, packet.dataMod)
	})
}


function safelyLeave(client) {
	//for(o in pluginManager.clientPlugins) {pluginManager.clientPlugins[o].onJoin(client)}
	if(client["controllingId"] == "") return;
	proxyClients[client["controllingId"]]["ended"] = true
	proxyClients[client["controllingId"]]?.end();
	proxyClients[client["controllingId"]].removeAllListeners();
	client.removeAllListeners("packet");
	client["controllingId"] = "" ;
	client.write('position', {
		x: 0,
		y: 5,
		z: 0,
		yaw: 0,
		pitch: 0,
		flags: 0x00
	});
}

function loginAndPosition(client) {

	client.write('login', {
		entityId: client.id,
		levelType: 'default',
		gameMode: 2,
		dimension: 0
	});
	client.write('position', {
		x: 0,
		y: 3,
		z: 0,
		yaw: 0,
		pitch: 0,
		flags: 0x00
	});
}