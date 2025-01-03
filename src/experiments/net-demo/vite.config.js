import { defineConfig } from "vite";
import { MopaintWebSocketServer } from "../server.js";

export default defineConfig({
	plugins: [
		{
			name: "vite-websocket-plugin",
			configureServer(server) {
				const mopaintServer = new MopaintWebSocketServer({ noServer: true });
				// Integrate WebSocket server with Vite's HTTP server
				server.httpServer?.on("upgrade", (request, socket, head) => {
					if (request.headers["sec-websocket-protocol"] === "mopaint-net-demo") {
						mopaintServer.server.handleUpgrade(request, socket, head, (ws) => {
							mopaintServer.server.emit("connection", ws, request);
						});
					}
				});
			},
		},
	],
});
