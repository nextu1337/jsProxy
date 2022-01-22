const { ClientPlugin } = require("../pluginAPI");

class Client extends ClientPlugin {
    name = "Client";
    shortName = "client";
    description = "Updates the client's variables based on packets sent";
    onJoin(client) {
        client["position"] = {x: 0, y: 0, z: 0};
        client["head"] = {yaw: 0, pitch: 0,headPitch:0};
    }

    onPacket(client, data, meta) {
        if(meta.name=="position")
        {
            client["position"]["x"] = data.x;
            client["position"]["y"] = data.y;
            client["position"]["z"] = data.z;
        }   
        if(meta.name=="look")
        {
            client["head"]["yaw"] = data.yaw;
            client["head"]["pitch"] = data.pitch;
            client["head"]["headPitch"] = data.pitch;
        }
    }
}

module.exports = Client;