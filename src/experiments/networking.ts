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

export interface Operation {
	timestamp: number;
	clientId: string | number;
	operationId: string;
	data: string;
	metaLevel: string;
}


let nextClientId = 1;
export class Client {
	clientId: number;
	metaHistory: Operation[] = [];
	localOperationListeners: Set<(operation: Operation) => void> = new Set();
	anyOperationListeners: Set<(operation: Operation) => void> = new Set();
	localOperationUpdatedListeners: Set<(operation: Operation, data: Record<string, { x: number, y: number }[]>) => void> = new Set();
	anyOperationUpdatedListeners: Set<(operation: Operation, data: Record<string, { x: number, y: number }[]>) => void> = new Set();

	constructor({ clientId }: { clientId?: number } = {}) {
		this.clientId = clientId ?? nextClientId++;
	}

	computeLinearHistory() {
		return resolveMetaHistory(this.metaHistory);
	}

	/**
	 * @param operation
	 * @param remote - whether the operation was received from the network or storage, rather than generated locally in this session
	 */
	addOperation(operation: Operation, remote = false) {
		// TODO: if remote, validate the operation has clientId and timestamp instead of filling them in
		// and validate the operationId is unique
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

	/**
	 * @param operationId
	 * @param data
	 * @param remote - whether the update was received from the network or storage, rather than generated locally in this session
	 */
	pushContinuousOperationData(operationId: string, data: Record<string, { x: number, y: number }[]>, remote = false) {
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
		//
		// Well, the other difference is that the continuous data may be considered to come from one client session,
		// and perhaps can be assumed to be ordered, whereas the operations list needs explicit ordering.

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
	 * @param listener - The listener function to handle the operation.
	 * @returns A function to remove the listener.
	 */
	onLocalOperation(listener: (operation: Operation) => void): () => void {
		this.localOperationListeners.add(listener);
		return () => {
			this.localOperationListeners.delete(listener);
		};
	}

	/**
	 * Listen for operations from this client or other clients.
	 * @param listener - The listener function to handle the operation.
	 * @returns A function to remove the listener.
	 */
	onAnyOperation(listener: (operation: Operation) => void): () => void {
		this.anyOperationListeners.add(listener);
		return () => {
			this.anyOperationListeners.delete(listener);
		};
	}

	/**
	 * Listen for operations from this client being updated.
	 * @param listener - The listener function to handle the operation update.
	 * @returns A function to remove the listener.
	 */
	onLocalOperationUpdated(listener: (operation: Operation, data: Record<string, { x: number, y: number }[]>) => void): () => void {
		this.localOperationUpdatedListeners.add(listener);
		return () => {
			this.localOperationUpdatedListeners.delete(listener);
		};
	}

	/**
	 * Listen for operations from this client or other clients being updated.
	 * @param listener - The listener function to handle the operation update.
	 * @returns A function to remove the listener.
	 */
	onAnyOperationUpdated(listener: (operation: Operation, data: Record<string, { x: number, y: number }[]>) => void): () => void {
		this.anyOperationUpdatedListeners.add(listener);
		return () => {
			this.anyOperationUpdatedListeners.delete(listener);
		};
	}
}

/**
 * Communicates between multiple clients in the same process.
 */
export class InProcessPeerParty {
	peers: Client[] = [];
	cleanupFns: (() => void)[] = [];

	addPeer(peer: Client) {
		this.peers.push(peer);
		this.cleanupFns.push(peer.onLocalOperation((operation) => {
			for (const otherPeer of this.peers) {
				if (otherPeer !== peer) {
					const operationCopy = JSON.parse(JSON.stringify(operation));
					otherPeer.addOperation(operationCopy, true);
				}
			}
		}));
		this.cleanupFns.push(peer.onLocalOperationUpdated((operation, data) => {
			for (const otherPeer of this.peers) {
				if (otherPeer !== peer) {
					const dataCopy = JSON.parse(JSON.stringify(data));
					otherPeer.pushContinuousOperationData(operation.operationId, dataCopy, true);
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
	ws: WebSocket;
	constructor(public client: Client, url: string) {
		this.ws = new WebSocket(url, "mopaint-net-demo");

		const pendingMessages = [];
		this.ws.addEventListener("open", () => {
			console.log("Connected to WebSocket server");
			for (const message of pendingMessages) {
				// console.log("Sending queued message:", message);
				this.ws.send(message);
			}
		});

		this.ws.addEventListener("close", () => {
			console.log("Disconnected from WebSocket server");
		});

		this.ws.addEventListener("message", (event) => {
			// Receive operations from the server
			if (typeof event.data !== "string") {
				console.error("Received non-string message:", event.data);
				return;
			}
			const message = JSON.parse(event.data);
			if (message.type === "operation") {
				this.client.addOperation(message.operation, true);
			} else if (message.type === "operationUpdate") {
				this.client.pushContinuousOperationData(message.operationId, message.data, true);
			}
		});

		// TODO: DRY
		this.client.onLocalOperation((operation) => {
			// Send local operations to the server
			const message = JSON.stringify({ type: "operation", operation });
			if (this.ws.readyState === WebSocket.OPEN) {
				// console.log("Sending operation to server:", operation);
				this.ws.send(message);
			} else {
				// console.log("WebSocket not open, queueing message for operation:", operation);
				pendingMessages.push(message);
			}
		});

		this.client.onLocalOperationUpdated((operation, data) => {
			// Send local operation updates to the server
			const message = JSON.stringify({ type: "operationUpdate", operationId: operation.operationId, data });
			if (this.ws.readyState === WebSocket.OPEN) {
				// console.log("Sending operation update to server:", operation, data);
				this.ws.send(message);
			} else {
				// console.log("WebSocket not open, queueing message for operation update:", operation, data);
				pendingMessages.push(message);
			}
		});
	}

	dispose() {
		this.ws.close();
	}
}

