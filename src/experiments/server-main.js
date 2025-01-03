import { MopaintWebSocketServer } from "./server.js";
new MopaintWebSocketServer({ port: process.env.PORT || 8080 });
