import WebSocket from "ws";

export class WebSocketServer {
	constructor(webSocketServerOptions) {
		this.server = new WebSocket.Server(webSocketServerOptions);
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
						console.log(`Sending message along from 'socket' to 'client': ${message}`);
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
		console.log(`WebSocket server is running on ws://localhost:${this.server.address().port}`);
	}

	dispose() {
		this.server.close();
		console.log("WebSocket server is closed");
	}
}
