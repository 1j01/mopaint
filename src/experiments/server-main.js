import { WebSocketServer } from "./server.js";
new WebSocketServer({ port: process.env.PORT || 8080 });
