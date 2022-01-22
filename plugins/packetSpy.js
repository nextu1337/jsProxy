const { ClientPlugin } = require("../pluginAPI")

class PacketSpy extends ClientPlugin {
    constructor(server,config,users,logger)
    {
        super(server,config,users,logger);
    }

    name="PacketSpy"
    shortName="ps"
    description="Spies on packets"
    version="1.0"
    author="nextu"

    spy = false;
    specificPacket = "";
    spyType = "";

    onTargetClientPacket(client,targetClient,data,meta)
    {
        if(meta.name == "map_chunk") return;
        let msg = {text:"§3"+this.getName()+" §9- §3"+"Received "+meta.name,hoverEvent:{"action":"show_text","value":JSON.stringify(data,null,2)}};
        if(this.spy && this.spyType=="received" && (meta.name == this.specificPacket || this.specificPacket == ""))
            client.write('chat', {message: JSON.stringify(msg)});
    }

    onPacket(client,data,meta) {
        if(meta.name=="flying" || meta.name=="position_look" || meta.name=="position" || meta.name=="look" || meta.name=="keep_alive") return;
        let msg = {text:"§3"+this.getName()+" §9- §3"+"Sent "+meta.name,hoverEvent:{"action":"show_text","value":JSON.stringify(data,null,2)}};
        if(this.spy && this.spyType=="sent" && (meta.name == this.specificPacket || this.specificPacket == ""))
        client.write('chat', {message: JSON.stringify(msg)});
    }

    onCommand(client,cmd,args)
    {
        if(cmd == "ps")
        {
            this.spy = !this.spy;
            let text = "§3"+this.getName()+" §9- §3";
            text+=this.spy?"§aEnabled,":"§cDisabled, no longer";
            text+=" spying on "+this.spyType+ " " + (this.specificPacket!=""?`(${this.specificPacket}) `:"") +"packets";
            client.write('chat', {message: JSON.stringify({text:text,position: 0,})});
        }
        if(cmd=="ps-type")
        {
            if(args.length==0) return client.write('chat', {message: JSON.stringify({text:"§3"+this.getName()+" §9- §3"+"§cNo packet type specified",position: 0,})});
            if(!["sent","received"].includes(args[0])) return client.write('chat', {message: JSON.stringify({text:"§3"+this.getName()+" §9- §3"+"§cInvalid packet type, possible packet types: sent, received",position: 0,})});
            this.spyType = args[0];
            client.write('chat', {message: JSON.stringify({text:"§3"+this.getName()+" §9- §3"+"§aSet packet type to "+this.spyType,position: 0,})});
        }
        if(cmd=="ps-packet")
        {
            if(args.length==0) return client.write('chat', {message: JSON.stringify({text:"§3"+this.getName()+" §9- §3"+"§cNo packet specified",position: 0,})});
            this.specificPacket = args.join(" ");
            client.write('chat', {message: JSON.stringify({text:"§3"+this.getName()+" §9 - §3"+"§aSet packet to "+this.specificPacket,position: 0,})});
        }
        if(cmd=="help")
        {
            client.write('chat', {message: JSON.stringify({text:`§3${this.config.config.prefix}ps §9- §3Toggle packet spy`,position: 0,})});
            client.write('chat', {message: JSON.stringify({text:`§3${this.config.config.prefix}ps-type <type> §9- §3Sets packet type to <type>`,position: 0,})});
            client.write('chat', {message: JSON.stringify({text:`§3${this.config.config.prefix}ps-packet <packet> §9- §3Sets packet to <packet>`,position: 0,})});
        }
    }
}

module.exports = PacketSpy;