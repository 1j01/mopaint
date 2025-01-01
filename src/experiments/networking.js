import { resolveMetaHistory } from "./meta-history";

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

/** 
 * Represents an arbitrary transport layer that may be backed by WebSockets, WebRTC, WebTransport, etc.,
 * possibly using a library like libp2p, or a closed-source service like Firebase,
 * or `postMessage` for locally syncing views across page contexts (`iframe`s, browser tabs, or Electron `BrowserWindow`s).
 * 
 * Main responsibilities:
 * - Syncing an append-only list of operations
 *   - Eventual consistency
 *   - Conflict resolution can be ignored for now, as drawing operations can always be considered before or after another operation
 * - In the future, sharing cache data using content-addressable storage
 * 
 * @abstract
 */
class Comms { // UNUSED
	/**
	 * @param {Operation} operation
	 */
	sendOperation(operation) { // eslint-disable-line no-unused-vars
		throw new Error("Not implemented");
	}

	/**
	 * @param {(operation: Operation) => void} callback
	 */
	onOperation(callback) { // eslint-disable-line no-unused-vars
		throw new Error("Not implemented");
	}
}

class InMemoryComms extends Comms { // UNUSED
	constructor() {
		super();
		this.otherComms = [];
	}

	/**
	 * @param {Operation} operation
	 */
	sendOperation(operation) {
		this.otherComms.forEach((comms) => {
			comms.onOperation(operation);
		});
	}

	/**
	 * @param {(operation: Operation) => void} callback
	 */
	onOperation(callback) {
		throw new Error("Nothing sensible to do here. Back to the drawing board.");
	}
}

export class Client {
	static nextClientId = 1;

	constructor() {
		this.clientId = Client.nextClientId++;
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
				(otherOperation.timestamp === operation.timestamp && otherOperation.clientId < operation.clientId)
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
