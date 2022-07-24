const { ClientPlugin } = require("../pluginAPI")

class PacketSpy extends ClientPlugin {
    name="PacketSpy"
    shortName="ps"
    description="Spies on packets"
    version="1.0"
    author="nextu"

    spy = false;
    specificPacket = "";
    spyType = "";
    ignored = {};
    onTargetClientPacket(client,tgc,packet)
    {
        let meta = {};
        let data = packet.data;
        meta["name"] = packet.name;

        if(this.ignored.type=="toClient",this.ignored.packet==meta.name) return packet.cancel();
        if(meta.name == "map_chunk") return;
        let msg = {text:"§3"+this.getName()+" §9- §3"+"Received "+meta.name,hoverEvent:{"action":"show_text","value":JSON.stringify(data,null,2)},clickEvent:{action:"suggest_command",value:JSON.stringify(data)}};
        if(this.spy && this.spyType=="received" && (meta.name == this.specificPacket || this.specificPacket == ""))
            client.write('chat', {message: JSON.stringify(msg)});
    }

    onPacket(client,packet) {
        let meta = {};
        let data = packet.data;
        meta["name"] = packet.name;

        if(this.ignored.type=="toServer",this.ignored.packet==packet.name) return packet.cancel();
        if(meta.name=="flying" || meta.name=="position_look" || meta.name=="position" || meta.name=="look" || meta.name=="keep_alive") return;
        let msg = {text:"§3"+this.getName()+" §9- §3"+"Sent "+meta.name,hoverEvent:{"action":"show_text","value":JSON.stringify(data,null,2)},clickEvent:{action:"suggest_command",value:JSON.stringify(data)}};
        if(this.spy && this.spyType=="sent" && (meta.name == this.specificPacket || this.specificPacket == ""))
        client.write('chat', {message: JSON.stringify(msg)});
    }

    onCommand(client,cmd,args)
    {
        let args2 = args;
        switch(cmd)
        {
            case "ps":
                this.spy = !this.spy;
                let text = "§3"+this.getName()+" §9- §3";
                text+=this.spy?"§aEnabled,":"§cDisabled, no longer";
                text+=" spying on "+this.spyType+ " " + (this.specificPacket!=""?`(${this.specificPacket}) `:"") +"packets";
                client.write('chat', {message: JSON.stringify({text:text,position: 0,})});
                break;
            case "ps-packet":
                if(args.length==0) return client.write('chat', {message: JSON.stringify({text:"§3"+this.getName()+" §9- §3"+"§cNo packet specified",position: 0,})});
                this.specificPacket = args.join(" ");
                client.write('chat', {message: JSON.stringify({text:"§3"+this.getName()+" §9 - §3"+"§aSet packet to "+this.specificPacket,position: 0,})});
                break;
            case "ps-type":
                if(args.length==0) return client.write('chat', {message: JSON.stringify({text:"§3"+this.getName()+" §9- §3"+"§cNo packet type specified",position: 0,})});
                if(!["sent","received"].includes(args[0])) return client.write('chat', {message: JSON.stringify({text:"§3"+this.getName()+" §9- §3"+"§cInvalid packet type, possible packet types: sent, received",position: 0,})});
                this.spyType = args[0];
                client.write('chat', {message: JSON.stringify({text:"§3"+this.getName()+" §9- §3"+"§aSet packet type to "+this.spyType,position: 0,})});
                break;
            case "help":
                client.write('chat', {message: JSON.stringify({text:`§3${this.config.config.prefix}ps §9- §3Toggle packet spy`,position: 0,})});
                client.write('chat', {message: JSON.stringify({text:`§3${this.config.config.prefix}ps-type <type> §9- §3Sets packet type to <type>`,position: 0,})});
                client.write('chat', {message: JSON.stringify({text:`§3${this.config.config.prefix}ps-packet <packet> §9- §3Sets packet to <packet>`,position: 0,})});
                break;
            case "ps-send":
                if(args.length==0) return client.write('chat', {message: JSON.stringify({text:"§3"+this.getName()+" §9- §3"+"§cNo packet specified",position: 0,})});
                let packet = args2.shift();
                let params = args2.join(" ");
                client["controlling"].write(packet,JSON.parse(params));
                break;
            case "ps-ignore":
                this.ignored = {type:args[0]||"",packet:args[1]||""};
                client.write('chat', {message: JSON.stringify({text:"§3"+this.getName()+" §9- §3"+"§aIgnoring "+this.ignored.packet,position: 0,})});
                break;
        }
    }
}

module.exports = PacketSpy;