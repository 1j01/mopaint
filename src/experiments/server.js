
import WebSocket from 'ws';

export class WebSocketServer {
	constructor(webSocketServerOptions) {
		this.server = new WebSocket.Server(webSocketServerOptions);
		this.clients = new Set();

		this.server.on('connection', (socket) => {
			this.clients.add(socket);

			socket.on('message', (message) => {
				// Broadcast the received message to all other clients
				for (const client of this.clients) {
					if (client !== socket && client.readyState === WebSocket.OPEN) {
						client.send(message);
					}
				}
			});

			socket.on('close', () => {
				this.clients.delete(socket);
			});
		});

		console.log(`WebSocket server is running on ${this.server.address()}`);
	}

	dispose() {
		this.server.close();
		console.log('WebSocket server is closed');
	}
}

if (require.main === module) {
	new WebSocketServer({ port: 8080 });
}
