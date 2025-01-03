import { resolveMetaHistory } from "./meta-history.js";

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

	/**
	 * @param {Object} options
	 * @param {number} options.clientId
	 */
	constructor({ clientId } = {}) {
		this.clientId = clientId ?? nextClientId++;
		/** @type {Operation[]} */
		this.metaHistory = [];

		// TODO: make events less verbose using EventTarget or something
		/** @type {((operation: Operation) => void)[]} */
		this.localOperationListeners = [];
		/** @type {((operation: Operation) => void)[]} */
		this.anyOperationListeners = [];
		/** @type {((operation: Operation, data: Record<string, {x: number, y: number}[]>) => void)[]} */
		this.localOperationUpdatedListeners = [];
		/** @type {((operation: Operation, data: Record<string, {x: number, y: number}[]>) => void)[]} */
		this.anyOperationUpdatedListeners = [];
	}

	computeLinearHistory() {
		return resolveMetaHistory(this.metaHistory);
	}

	/**
	 * @param {Operation} operation
	 */
	addOperation(operation) {
		// It's remote even if it's from the same client, since after a page refresh, prior operations are sent to the client.
		// This is not very robust, but it's a start. In the future we'll have to deal with malicious peers sending messages
		// with no clientId, or a spoofed clientId.
		const remote = "clientId" in operation;

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

		if (!remote) {
			for (const listener of this.localOperationListeners) {
				listener(operation);
			}
		}
		for (const listener of this.anyOperationListeners) {
			listener(operation);
		}
	}

	pushContinuousOperationData(operationId, data, remote = false) {
		// I feel like I'm overstepping the bounds of what consists as an "operation", or rather,
		// that these continuously appended buffers could be better divorced from the concept of an operation, for future use cases and/or clarity.
		// I may even be able to treat the operations list and the brush stroke data similarly, if I structure it so,
		// both being append-only lists (in general, at least), and could potentially simplify the system that I'm developing.
		// It would basically mean adding indirection to the operation's continuously updatable data buffer reference.
		// It might be like a buffer ID, instead of using the operation's ID + a top-level key to identify the buffer for updating across the network.
		//
		// That said, the reason to have a separate buffer in the first place isn't a fundamental one, but rather for performance:
		// If for every update it sent either the whole operation or an "update operation", the overhead of the operation objects would be significant.
		// So if it's better for ergonomics to deal with whole operation objects and important for performance to use ArrayBuffer objects for stroke data,
		// it may complicate a general system, and abstractions can have a performance cost as well.
		//
		// That said again, not all operations may want to pack data in the same way, so the abstraction may be necessary anyway,
		// and it may indeed be simpler, so it's worth exploring.

		// TODO: use a Map to look up the operation by ID in one step
		const operation = this.metaHistory.find((op) => op.operationId === operationId);
		if (!operation) {
			console.error("Operation not found:", operationId);
			return;
		}
		// TODO: record timestamp of each sample
		// Also, this is pretty informal right now, just updating arbitrary keys in the operation object (and assuming they're arrays).
		for (let key in data) {
			operation[key].push(data[key]);
		}

		if (!remote) {
			for (const listener of this.localOperationUpdatedListeners) {
				listener(operation, data);
			}
		}
		for (const listener of this.anyOperationUpdatedListeners) {
			listener(operation, data);
		}
	}

	/**
	 * Listen for operations generated from this client.
	 * @param {(operation: Operation) => void} listener
	 * @returns {() => void} function to remove the listener
	 */
	onLocalOperation(listener) {
		this.localOperationListeners.push(listener);
		return () => {
			this.localOperationListeners = this.localOperationListeners.filter((fn) => fn !== listener);
		};
	}

	/**
	 * Listen for operations from this client or other clients.
	 * @param {(operation: Operation) => void} listener
	 * @returns {() => void} function to remove the listener
	 */
	onAnyOperation(listener) {
		this.anyOperationListeners.push(listener);
		return () => {
			this.anyOperationListeners = this.anyOperationListeners.filter((fn) => fn !== listener);
		};
	}

	/**
	 * Listen for operations from this client being updated.
	 * @param {(operation: Operation) => void} listener
	 * @returns {() => void} function to remove the listener
	 */
	onLocalOperationUpdated(listener) {
		this.localOperationUpdatedListeners.push(listener);
		return () => {
			this.localOperationUpdatedListeners = this.localOperationUpdatedListeners.filter((fn) => fn !== listener);
		};
	}

	/**
	 * Listen for operations from this client or other clients being updated.
	 * @param {(operation: Operation) => void} listener
	 * @returns {() => void} function to remove the listener
	 */
	onAnyOperationUpdated(listener) {
		this.anyOperationUpdatedListeners.push(listener);
		return () => {
			this.anyOperationUpdatedListeners = this.anyOperationUpdatedListeners.filter((fn) => fn !== listener);
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
		this.cleanupFns.push(peer.onLocalOperation((operation) => {
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
export class MopaintWebSocketClient {
	/**
	 * @param {Client} client
	 * @param {string} url
	 */
	constructor(client, url) {
		this.ws = new WebSocket(url, "mopaint-net-demo");
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
			const message = JSON.parse(event.data);
			if (message.type === "operation") {
				this.client.addOperation(message.operation);
			} else if (message.type === "operationUpdate") {
				this.client.pushContinuousOperationData(message.operationId, message.data, true);
			}
		});

		// TODO: DRY
		this.client.onLocalOperation((operation) => {
			// Send local operations to the server
			const message = JSON.stringify({ type: "operation", operation });
			if (this.ws.readyState === WebSocket.OPEN) {
				console.log("Sending operation to server:", operation);
				this.ws.send(message);
			} else {
				console.log("WebSocket not open, queueing message for operation:", operation);
				pendingMessages.push(message);
			}
		});

		this.client.onLocalOperationUpdated((operation, data) => {
			// Send local operation updates to the server
			const message = JSON.stringify({ type: "operationUpdate", operationId: operation.operationId, data });
			if (this.ws.readyState === WebSocket.OPEN) {
				console.log("Sending operation update to server:", operation, data);
				this.ws.send(message);
			} else {
				console.log("WebSocket not open, queueing message for operation update:", operation, data);
				pendingMessages.push(message);
			}
		});
	}

	dispose() {
		this.ws.close();
	}
}

