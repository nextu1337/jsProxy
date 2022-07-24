const { ClientPlugin } = require("../pluginAPI");
const Chunk = require('prismarine-chunk')('1.8')
const Vec3 = require('vec3')

class Client extends ClientPlugin {
    name = "Client";
    shortName = "client";
    description = "Updates the client's variables based on packets sent";
    onJoin(client) {
        client["position"] = {x: 0, y: 0, z: 0};
        client["head"] = {yaw: 0, pitch: 0,headPitch:0};
    }

    onTargetClientPacket(client,targetClient, packet) {
        if(packet.name=="position")
        {
            client["position"]["x"] = packet.data.x;
            client["position"]["y"] = packet.data.y;
            client["position"]["z"] = packet.data.z;
            client["head"]["yaw"] = packet.data.yaw;
            client["head"]["pitch"] = packet.data.pitch;
            client["head"]["headPitch"] = packet.data.pitch;
        }   
    }


    onPacket(client, packet) {
        if(packet.name=="position")
        {
            client["position"]["x"] = packet.data.x;
            client["position"]["y"] = packet.data.y;
            client["position"]["z"] = packet.data.z;
        }   
        if(packet.name=="look")
        {
            client["head"]["yaw"] = packet.data.yaw;
            client["head"]["pitch"] = packet.data.pitch;
            client["head"]["headPitch"] = packet.data.pitch;
        }
    }

    onCommand(client,cmd,args)
    {
        switch(cmd)
        {
            case "fixpos":
                client.write("position",{x:client.position.x,y:client.position.y+1,z:client.position.z,yaw:0,pitch:0,flags:0})
                break;
        }
    }
}

module.exports = Client;