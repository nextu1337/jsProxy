# jsProxy

[![Discord](https://camo.githubusercontent.com/17c914de92d32b7b329dc3af356087944549480570a5dcf10ac10af8310f05d3/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f636861742d6f6e253230646973636f72642d627269676874677265656e2e737667)](https://discord.gg/s7K6EKfrdH)

jsProxy is a minecraft proxy that supports custom plugins,
it is powered by [PrismarineJS/node-minecraft-protocol](https://github.com/PrismarineJS/node-minecraft-protocol)

## Features
- Plugins.
- Permissions

## Installation
- Configure config.json and users.json
- Run `npm i`
- Run `start.bat`
- Connect to `127.0.0.1:25565`

## Default plugins
| Plugin | Description |
| ------ | ------ |
| Client | Updates client variables |
| Server | Manages server and users database, includes Login  |
| IRC | Allows communication between online proxy users |
| PacketSpy | Spies on packets sent and received by player |
| PluginManager | Registers, loads and reloads plugins |
| PluginAPI | It's not much of an API but it works |
| Permissions | Adds roles and permissions, configurable in users.json and config.json |

## Official plugins
| Plugin | Author | Description |
| ------ | ------ | ----------- |
| MobSpawn | nextu | Allows user to spawn mobs locally |

## TODO
- Actually implement connecting with either HTTP or SOCKS proxy
- Fix bug that sends packets X times (X being the number of how many times user connected to a server)

[![CC](https://camo.githubusercontent.com/11b9a412da4f93e847989b8255d8b77d92aecf51741005da3e6e3b8c2b79b219/68747470733a2f2f692e6372656174697665636f6d6d6f6e732e6f72672f6c2f62792d6e632f342e302f38387833312e706e67)](https://creativecommons.org/licenses/by-nc/4.0/)
**jsProxy** is licensed under a [Creative Commons Attribution-NonCommercial 4.0 International License](https://creativecommons.org/licenses/by-nc/4.0/).
