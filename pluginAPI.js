function getChunk(coordinate)
  {
    // Coordinate can be either X or Z
    while(coordinate%16!=0)
      coordinate--;
    return coordinate/16;
  }

class GUI {
  static get GUI_CLICK() { return 'window_click'; }
  static get GUI_CLOSE() { return 'close_window'; }
  static get GUI_OPEN() { return 'open_window'; }
  static get GUI_SIGN_UPDATE() { return 'update_sign'; }
  constructor(id,rows,title)
  {
    this.windowId=id%0x100;
    this.inventoryType="minecraft:container"
    this.windowTitle=JSON.stringify(title);
    this.slotCount=9*rows;
    this.items=[];
  }
  showSignGui(client)
  {
    let loc = {"x":client.position.x,"y":254,"z":client.position.z};
    client.write("open_sign_entity",{"location":loc})
  }
  createItem(id,count=1,nbtData=undefined)
  {
    if(id==0) return {blockId: -1,itemCount: 0,itemDamage:0};
    
    return {
      blockId: id>0?id:-1,
      itemCount: count||0,
      itemDamage:0,
      nbtData: ObjectToNBT(nbtData)
    };
  }
  addItem(item)
  {
    // Adds item to the inventory
    this.items.push(item);
  }
  addItems(items)
  {
    // Adds items to the inventory
    for(let item of items)
      this.addItem(item);
  }
  addItemAt(item,slot)
  {
    if(slot+1>=this.slotCount) return;
    this.items[slot] = item;
  }
  displayItems(client)
  {
    client.write("window_items",{
      windowId: this.windowId,
      items: this.items,
    });
  }
  displayGUI(client)
  {
    client.write("open_window",{
      windowId: this.windowId,
      inventoryType: this.inventoryType,
      windowTitle: this.windowTitle,
      slotCount: this.slotCount,
    });
  }
  display(client)
  {
    for(let i=0;i<this.slotCount;i++)
          if(!this.items[i]) this.items[i]=this.createItem(0);
    // Displays the GUI
    this.displayGUI(client);
    setTimeout(()=>{this.displayItems(client)},50)
  }
}

class API {
  constructor() {
    this.GUI = GUI;
    this.getChunk = getChunk;
  }
  getCurrentTime()
  {
    // Retrieves current timestamp
    return new Date().getTime();
  }
  displayTitle(client,title)
  {
    client.write('title',{action:0,text: JSON.stringify({text: title})})
  }
  messageJoin(msg)
  {
    // Joins the Message JSON to raw text, no colors
      let toReturn = JSON.parse(msg)?.text||"";
      for(let i of JSON.parse(msg)?.extra||[])
          toReturn+=i?.text||""
      return toReturn.toString();
  }
  cancelEvent(client,type,name,data)
  {
    // Simple stuff
    client["cancelEvent"] = {type:type,name:name,data:data};
  }
  removeColors(msg)
  {
    let lP = false;
    let newString = "";
    for(let i of msg)
    {
        if(i=="§")
        {
            lP=true;
            continue;
        }
        if(lP)
        {
            lP=false;
            continue;
        }
        newString+=i;
    }
    return newString;
  }
}

class Packet
{
  constructor(client,type,meta,data)
  {
    this.client = client;
    this.type = type;
    this.data = data;
    this.dataMod = data;
    this.name = meta.name;
  }
  get(key)
  {
    return this.data[key];
  }
  modify(key,value)
  {
    return this.dataMod[key]=value;
  }
  cancel()
  {
    this.client["cancelEvent"] = {type:this.type,name:this.name,data:this.data};
  }
}

class plugin {
  constructor(server,config,users,logger) {
    this.server = server;
    this.config = config;
    this.users = users;
    this.logger = logger;
}
    name = "Unnamed";
    shortName = "unmd";
    description = "No description";
    version = "0.0.0"
    author = "Unknown";
    API = new API();
    load() { }
    unload() { }
    getName() { return this.name; }
    getShortName() { return this.shortName; }
    getDescription() { return this.description; }
    getVersion() { return this.version; }
    getAuthor() { return this.author; }
    getInfo() { return { name: this.name, shortName: this.shortName, description: this.description, version: this.version, author: this.author }; }
    broadcast (message, to) {
      let client
      for (const clientId in this.server.clients) {
        if (this.server.clients[clientId] === undefined || (!this.server.clients[clientId]?.loggedIn && to=="all")) continue
        client = this.server.clients[clientId]
        if (client == to || to=="all") {
          const msg = {text: message}
          client.write('chat', {message: JSON.stringify(msg),position: 0})
        }
      }
  }
}

class TargetClientPlugin extends plugin {
    type = "targetClient";
    onJoin(tclient, data) { }
    onPacket(tclient, packet) { }
    onEnd(tclient, reason) { }
    onError(tclient, err) { }
}

class ClientPlugin extends plugin {
    type = "client";
    onCommand(client, cmd, args) { }
    onJoin(client) { }
    onPacket(client, packet) { }
    onTargetClientPacket(client, tgClient, packet) { }
    onTargetClientEnd(client,tgClient, reason) { }
    onChat(client, data) { }
    onEnd(client, reason) { }
    onConnect(client, server, proxy) { }

}

class ServerPlugin extends plugin {
    type = "server";
    onJoin(client) { }
    onEnd(client, reason) { }
    onChat(client, data) { }
    onCommand(client, cmd, args) { }
}

module.exports = {
    Packet,
    plugin,
    TargetClientPlugin,
    ClientPlugin,
    ServerPlugin
}