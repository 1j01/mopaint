import { InProcessPeerParty, WebSocketClient } from "./networking.js";
import { WebSocketServer } from "./server.js";

describe("Peer + InProcessPeerParty", () => {
	it("should allow communication", () => {
		const peerA = new Peer({ peerId: 1 });
		const peerB = new Peer({ peerId: 2 });
		const party = new InProcessPeerParty();
		party.addPeer(peerA);
		party.addPeer(peerB);
		peerA.addOperation({ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", timestamp: 0 });
		peerB.addOperation({ id: "abc2", metaLevel: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green", timestamp: 1 });
		expect(peerA.metaHistory).toEqual([
			{ peerId: 1, id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", timestamp: 0 },
			{ peerId: 2, id: "abc2", metaLevel: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green", timestamp: 1 },
		]);
		expect(peerB.metaHistory).toEqual(peerA.metaHistory);

		// expect(peerA.computeLinearHistory()).toEqual([
		// 	{ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "green", },
		// ]);
		party.dispose();
	});
	it("should order operations according to timestamp", () => {
		const peerA = new Peer({ peerId: 1 });
		const peerB = new Peer({ peerId: 2 });
		const party = new InProcessPeerParty();
		party.addPeer(peerA);
		party.addPeer(peerB);
		peerA.addOperation({ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", timestamp: 1 });
		peerB.addOperation({ id: "abc2", metaLevel: 0, type: "line", name: "Draw Line", color: "yellow", timestamp: 0 });
		expect(peerA.metaHistory).toEqual([
			{ peerId: 2, id: "abc2", metaLevel: 0, type: "line", name: "Draw Line", color: "yellow", timestamp: 0 },
			{ peerId: 1, id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", timestamp: 1 },
		]);
		expect(peerB.metaHistory).toEqual(peerA.metaHistory);
		party.dispose();
	});
	it("should order operations according to peerId and order received if timestamps are equal", () => {
		const peerA = new Peer({ peerId: 1 });
		const peerB = new Peer({ peerId: 2 });
		const party = new InProcessPeerParty();
		party.addPeer(peerA);
		party.addPeer(peerB);
		peerA.addOperation({ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", timestamp: 1 });
		peerB.addOperation({ id: "abc2", metaLevel: 0, type: "line", name: "Draw Line", color: "yellow", timestamp: 1 });
		peerB.addOperation({ id: "abc3", metaLevel: 0, type: "line", name: "Draw Line", color: "green", timestamp: 1 });
		peerA.addOperation({ id: "abc4", metaLevel: 0, type: "line", name: "Draw Line", color: "red", timestamp: 1 });
		expect(peerA.metaHistory).toEqual([
			{ peerId: 1, id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", timestamp: 1 },
			{ peerId: 1, id: "abc4", metaLevel: 0, type: "line", name: "Draw Line", color: "red", timestamp: 1 },
			{ peerId: 2, id: "abc2", metaLevel: 0, type: "line", name: "Draw Line", color: "yellow", timestamp: 1 },
			{ peerId: 2, id: "abc3", metaLevel: 0, type: "line", name: "Draw Line", color: "green", timestamp: 1 },
		]);
		expect(peerB.metaHistory).toEqual(peerA.metaHistory);
		party.dispose();
	});
});

/**
 * @param {Peer[]} peers
 * @param {number} expectedMetaHistoryLength
 * @returns {Promise<void>}
 */
const waitForSynchronization = (peers, expectedMetaHistoryLength) => {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(new Error(`Synchronization timed out. Peers have metaHistory lengths that aren't ${expectedMetaHistoryLength}: ${peers.map((peer) => `peer '${peer.peerId}' has ${peer.metaHistory.length}`).join(", ")}`));
		}, 4000);

		const checkSynchronization = () => {
			if (
				peers.every((peer) => peer.metaHistory.length === expectedMetaHistoryLength)
				// &&
				// JSON.stringify(peerA.metaHistory) === JSON.stringify(peerB.metaHistory)
			) {
				clearTimeout(timeout);
				resolve();
			} else {
				setTimeout(checkSynchronization, 50);
			}
		};
		checkSynchronization();
	});
};


describe("Peer + WebSocketServer + WebSocketClient", () => {
	it("should allow communication", async () => {
		const server = new WebSocketServer({ port: 8283 });
		try {
			const peerA = new Peer({ peerId: 1 });
			const peerB = new Peer({ peerId: 2 });
			// TODO: dispose of these WebSocketClient objects
			new WebSocketClient(peerA, "ws://localhost:8283");
			new WebSocketClient(peerB, "ws://localhost:8283");
			peerA.addOperation({ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", timestamp: 0 });
			peerB.addOperation({ id: "abc2", metaLevel: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green", timestamp: 1 });
			await waitForSynchronization([peerA, peerB], 2);
			expect(peerA.metaHistory).toEqual([
				{ peerId: 1, id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", timestamp: 0 },
				{ peerId: 2, id: "abc2", metaLevel: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green", timestamp: 1 },
			]);
			expect(peerB.metaHistory).toEqual(peerA.metaHistory);
		} finally {
			server.dispose();
		}
	});
});
