import { resolveMetaHistory } from "./meta-history";

// Networking Prototype
// Goals:
// - Transport agnostic.
//   Establish a simple protocol that could be backed by WebSockets, WebRTC, WebTransport, etc.,
//   possibly using a library like libp2p (which supports all of the above), or even a closed-source service like Firebase.
//   Also, non-network transports like `BroadcastChannel`, or `iframe.contentWindow.postMessage`, or Electron's IPC system
//   will be useful for locally syncing views of the same document across different page contexts (browser tabs, `iframe`s, or Electron `BrowserWindow`s).
//   Also, an in-process implementation is useful for testing.
// - Syncing an append-only list of operations
//   - Eventual consistency
//   - Conflict resolution can be ignored for now, as drawing operations can always be considered independently ordered
// - In the future, sharing cache data using content-addressable storage

// Should there be a message type separate from the operation type?
// Probably, something like that.
// Eventually we'll want to stream buffers of data like mouse movements, associated with a single operation,
// (probably with timestamp information interleaved with the data).
// And at any rate, different applications want different types of operations,
// so we might want a generic type like Message<DrawingOperation>.
// Not sure. It's likely to end up outside of TypeScript's type system.
// We could be using rust or go in a year, or jai in 10 years.
// Or it might not make sense if a drawing app can dynamically load spreadsheet capabilities,
// meaning at compile time it's not going to know what all the operation types are.
// (I am trying to build an operating system of sorts, similar to VS Code, or a web browser, or Blender.
// A generative technology, as Jeff Lindsay puts it.)

/**
 * @typedef {Object} Operation
 * @property {number} timestamp
 * @property {string} clientId
 * @property {string} operationId
 * @property {string} data
 * @property {string} metaLevel
 */


let nextClientId = 1;
export class Client {

	constructor({ clientId } = {}) {
		this.clientId = clientId ?? nextClientId++;
		this.metaHistory = [];
		this.operationListeners = [];
	}

	computeLinearHistory() {
		return resolveMetaHistory(this.metaHistory);
	}

	/**
	 * @param {Operation} operation
	 */
	addOperation(operation) {
		operation.clientId ??= this.clientId;
		operation.timestamp ??= Date.now();

		// Search backwards to find where to insert the operation
		let i = this.metaHistory.length - 1;
		for (; i >= 0; i--) {
			const otherOperation = this.metaHistory[i];
			if (
				otherOperation.timestamp < operation.timestamp ||
				// use client ID as a tiebreaker for equal timestamps
				// might need vector clocks or something more sophisticated in the future
				(otherOperation.timestamp === operation.timestamp && otherOperation.clientId <= operation.clientId)
			) {
				break;
			}
		}
		this.metaHistory.splice(i + 1, 0, operation);

		if (operation.clientId === this.clientId) {
			for (const listener of this.operationListeners) {
				listener(operation);
			}
		}
	}

	/**
	 * Listen for operations from other clients.
	 * @param {(operation: Operation) => void} listener
	 * @returns {() => void} function to remove the listener
	 */
	onOperation(listener) {
		this.operationListeners.push(listener);
		return () => {
			this.operationListeners = this.operationListeners.filter((fn) => fn !== listener);
		};
	}
}

/**
 * Communicates between multiple clients in the same process.
 */
export class InProcessPeerParty {
	constructor() {
		this.peers = [];
		this.cleanupFns = [];
	}

	/**
	 * @param {Client} peer
	 */
	addPeer(peer) {
		this.peers.push(peer);
		this.cleanupFns.push(peer.onOperation((operation) => {
			for (const otherPeer of this.peers) {
				if (otherPeer !== peer) {
					otherPeer.addOperation(operation);
				}
			}
		}));
	}

	dispose() {
		for (const cleanup of this.cleanupFns) {
			cleanup();
		}
	}
}

/**
 * Communicates with a WebSocket server. (See server.js)
 */
export class WebSocketClient {
	constructor(client, url) {
		this.ws = new WebSocket(url);
		this.client = client;

		const pendingMessages = [];
		this.ws.addEventListener("open", () => {
			console.log("Connected to WebSocket server");
			for (const message of pendingMessages) {
				console.log("Sending queued message:", message);
				this.ws.send(message);
			}
		});

		this.ws.addEventListener("message", (event) => {
			// Receive operations from the server
			if (typeof event.data !== "string") {
				console.error("Received non-string message:", event.data);
				return;
			}
			const operation = JSON.parse(event.data);
			this.client.addOperation(operation);
		});

		this.client.onOperation((operation) => {
			// Send local operations to the server
			if (this.ws.readyState === WebSocket.OPEN) {
				console.log("Sending operation to server:", operation);
				this.ws.send(JSON.stringify(operation));
			} else {
				console.log("WebSocket not open, queueing message for operation:", operation);
				pendingMessages.push(JSON.stringify(operation));
			}
		});
	}

	dispose() {
		this.ws.close();
	}
}

