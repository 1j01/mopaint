import { resolveMetaHistory } from "./meta-history";

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
 */
export class Comms {
	/**
	 * @param {Operation} operation
	 */
	sendOperation(operation) {
		throw new Error("Not implemented");
	}

	/**
	 * @param {(operation: Operation) => void} callback
	 */
	onOperation(callback) {
		throw new Error("Not implemented");
	}
}

export class InMemoryComms extends Comms {
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
		
	}
}

export class Client {
	/**
	 * @param {Comms} comms
	 */
	constructor(comms) {
		this.comms = comms;
		this.metaHistory = [];
	}

	computeLinearHistory() {
		return resolveMetaHistory(this.metaHistory);
	}

	/**
	 * @param {Operation} operation
	 */
	addOperation(operation) {
		this.metaHistory.push(operation);
		this.comms.sendOperation(operation);
	}
}