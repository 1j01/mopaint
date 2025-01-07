import { MopaintWebSocketServer } from "./server.ts";
new MopaintWebSocketServer({ port: process.env.PORT || 8080 });
