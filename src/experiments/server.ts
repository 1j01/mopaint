import { AddressInfo, ServerOptions, WebSocket, WebSocketServer } from "ws";

// TODO: ensure unique IDs for operations
// TODO: ensure unique IDs for clients, and perhaps assign IDs server-side

export class MopaintWebSocketServer {
	server: WebSocketServer;
	clients: Set<WebSocket>;
	constructor(webSocketServerOptions: ServerOptions) {
		this.server = new WebSocketServer(webSocketServerOptions);
		this.clients = new Set();

		// Store messages to send to new clients.
		// This is essentially the "document state".
		const messages = [];

		this.server.on("connection", (socket) => {
			this.clients.add(socket);

			// send previous messages to the new client
			for (const message of messages) {
				socket.send(message.data, { binary: message.isBinary });
			}

			socket.on("message", (message, isBinary) => {
				// Broadcast the received message to all other clients
				for (const client of this.clients) {
					if (client !== socket && client.readyState === WebSocket.OPEN) {
						client.send(message, { binary: isBinary });
					}
				}
				// and future clients
				messages.push({ data: message, isBinary });
			});

			socket.on("close", () => {
				this.clients.delete(socket);
			});
		});

		// TODO: get the actual address?
		if (this.server.options.noServer) {
			console.log(`MopaintWebSocketServer is running in "noServer" mode`);
		} else {
			console.log(`MopaintWebSocketServer is running on ws://localhost:${(this.server.address() as AddressInfo).port}`);
		}
	}

	dispose() {
		this.server.close();
		console.log("MopaintWebSocketServer is closed");
	}
}
