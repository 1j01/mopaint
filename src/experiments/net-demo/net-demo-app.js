import { Client, MopaintWebSocketClient } from "../networking.js";

const client = new Client();
new MopaintWebSocketClient(client, `ws://localhost:${import.meta.env.PORT || 8080}`);

client.addOperation({ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", timestamp: 0 });
