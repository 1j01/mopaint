import { HistoryStore, InProcessPeerParty, MopaintWebSocketClient } from "./networking.ts";
import { MopaintWebSocketServer } from "./server.ts";

describe("HistoryStore + InProcessPeerParty", () => {
	it("should allow communication", () => {
		const storeA = new HistoryStore({ clientId: 1 });
		const storeB = new HistoryStore({ clientId: 2 });
		const party = new InProcessPeerParty();
		party.addPeer(storeA);
		party.addPeer(storeB);
		storeA.addOperation({ operationId: "abc1", data: { metaLevel: 0, type: "line", name: "Draw Line", color: "blue" }, timestamp: 0 });
		storeB.addOperation({ operationId: "abc2", data: { metaLevel: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green" }, timestamp: 1 });
		expect(storeA.metaHistory).toEqual([
			{ clientId: 1, operationId: "abc1", data: { metaLevel: 0, type: "line", name: "Draw Line", color: "blue" }, timestamp: 0 },
			{ clientId: 2, operationId: "abc2", data: { metaLevel: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green" }, timestamp: 1 },
		]);
		expect(storeB.metaHistory).toEqual(storeA.metaHistory);

		// expect(storeA.computeLinearHistory()).toEqual([
		// 	{ operationId: "abc1", data: { metaLevel: 0, type: "line", name: "Draw Line", color: "green", }},
		// ]);
		party.dispose();
	});
	it("should order operations according to timestamp", () => {
		const storeA = new HistoryStore({ clientId: 1 });
		const storeB = new HistoryStore({ clientId: 2 });
		const party = new InProcessPeerParty();
		party.addPeer(storeA);
		party.addPeer(storeB);
		storeA.addOperation({ operationId: "abc1", data: { metaLevel: 0, type: "line", name: "Draw Line", color: "blue" }, timestamp: 1 });
		storeB.addOperation({ operationId: "abc2", data: { metaLevel: 0, type: "line", name: "Draw Line", color: "yellow" }, timestamp: 0 });
		expect(storeA.metaHistory).toEqual([
			{ clientId: 2, operationId: "abc2", data: { metaLevel: 0, type: "line", name: "Draw Line", color: "yellow" }, timestamp: 0 },
			{ clientId: 1, operationId: "abc1", data: { metaLevel: 0, type: "line", name: "Draw Line", color: "blue" }, timestamp: 1 },
		]);
		expect(storeB.metaHistory).toEqual(storeA.metaHistory);
		party.dispose();
	});
	it("should order operations according to clientId and order received if timestamps are equal", () => {
		const storeA = new HistoryStore({ clientId: 1 });
		const storeB = new HistoryStore({ clientId: 2 });
		const party = new InProcessPeerParty();
		party.addPeer(storeA);
		party.addPeer(storeB);
		storeA.addOperation({ operationId: "abc1", data: { metaLevel: 0, type: "line", name: "Draw Line", color: "blue" }, timestamp: 1 });
		storeB.addOperation({ operationId: "abc2", data: { metaLevel: 0, type: "line", name: "Draw Line", color: "yellow" }, timestamp: 1 });
		storeB.addOperation({ operationId: "abc3", data: { metaLevel: 0, type: "line", name: "Draw Line", color: "green" }, timestamp: 1 });
		storeA.addOperation({ operationId: "abc4", data: { metaLevel: 0, type: "line", name: "Draw Line", color: "red" }, timestamp: 1 });
		expect(storeA.metaHistory).toEqual([
			{ clientId: 1, operationId: "abc1", data: { metaLevel: 0, type: "line", name: "Draw Line", color: "blue" }, timestamp: 1 },
			{ clientId: 1, operationId: "abc4", data: { metaLevel: 0, type: "line", name: "Draw Line", color: "red" }, timestamp: 1 },
			{ clientId: 2, operationId: "abc2", data: { metaLevel: 0, type: "line", name: "Draw Line", color: "yellow" }, timestamp: 1 },
			{ clientId: 2, operationId: "abc3", data: { metaLevel: 0, type: "line", name: "Draw Line", color: "green" }, timestamp: 1 },
		]);
		expect(storeB.metaHistory).toEqual(storeA.metaHistory);
		party.dispose();
	});
	it("should handle updates to continuous operations", () => {
		const storeA = new HistoryStore({ clientId: 1 });
		const storeB = new HistoryStore({ clientId: 2 });
		const party = new InProcessPeerParty();
		party.addPeer(storeA);
		party.addPeer(storeB);
		storeA.addOperation({ operationId: "abc1", data: { metaLevel: 0, type: "brush", name: "Brush", points: [{ x: 5, y: 5 }] }, timestamp: 0 });
		storeA.pushContinuousOperationData("abc1", { points: { x: 10, y: 10 } });
		expect(storeA.metaHistory).toEqual([
			{ clientId: 1, operationId: "abc1", data: { metaLevel: 0, type: "brush", name: "Brush", points: [{ x: 5, y: 5 }, { x: 10, y: 10 }] }, timestamp: 0 },
		]);
		expect(storeB.metaHistory).not.toBe(storeA.metaHistory); // must not cheat by copying the reference
		expect(storeB.metaHistory[0]).not.toBe(storeA.metaHistory[0]); // must not cheat by copying the reference
		expect(storeB.metaHistory[0].data.points[1]).not.toBe(storeA.metaHistory[0].data.points[1]); // must not cheat by copying the reference
		expect(storeB.metaHistory).toEqual(storeA.metaHistory); // should match though

		// expect(storeA.computeLinearHistory()).toEqual([
		// 	{ operationId: "abc1", data: { metaLevel: 0, type: "line", name: "Draw Line", color: "green", }},
		// ]);
		party.dispose();
	});
});

/**
 * @param {HistoryStore[]} stores
 * @param {number} expectedMetaHistoryLength
 * @returns {Promise<void>}
 */
const waitForSynchronization = (stores, expectedMetaHistoryLength) => {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(new Error(`Synchronization timed out. History stores have metaHistory lengths that aren't ${expectedMetaHistoryLength}: ${stores.map((client) => `client '${client.clientId}' has ${client.metaHistory.length}`).join(", ")}`));
		}, 4000);

		const checkSynchronization = () => {
			if (
				stores.every((store) => store.metaHistory.length === expectedMetaHistoryLength)
				// &&
				// JSON.stringify(storeA.metaHistory) === JSON.stringify(storeB.metaHistory)
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


describe("HistoryStore + MopaintWebSocketServer + MopaintWebSocketClient", () => {
	it("should allow communication", async () => {
		const server = new MopaintWebSocketServer({ port: 8283 });
		try {
			const storeA = new HistoryStore({ clientId: 1 });
			const storeB = new HistoryStore({ clientId: 2 });
			// TODO: dispose of these clients
			new MopaintWebSocketClient(storeA, "ws://localhost:8283");
			new MopaintWebSocketClient(storeB, "ws://localhost:8283");
			storeA.addOperation({ operationId: "abc1", data: { metaLevel: 0, type: "line", name: "Draw Line", color: "blue" }, timestamp: 0 });
			storeB.addOperation({ operationId: "abc2", data: { metaLevel: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green" }, timestamp: 1 });
			await waitForSynchronization([storeA, storeB], 2);
			expect(storeA.metaHistory).toEqual([
				{ clientId: 1, operationId: "abc1", data: { metaLevel: 0, type: "line", name: "Draw Line", color: "blue" }, timestamp: 0 },
				{ clientId: 2, operationId: "abc2", data: { metaLevel: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green" }, timestamp: 1 },
			]);
			expect(storeB.metaHistory).toEqual(storeA.metaHistory);
		} finally {
			server.dispose();
		}
	});
	it("clients with the same ID should not rebroadcast each others' messages", async () => {
		const server = new MopaintWebSocketServer({ port: 8283 });
		try {
			const storeA = new HistoryStore({ clientId: 1 });
			const storeB = new HistoryStore({ clientId: 1 });
			// TODO: dispose of these clients
			new MopaintWebSocketClient(storeA, "ws://localhost:8283");
			new MopaintWebSocketClient(storeB, "ws://localhost:8283");
			storeA.addOperation({ operationId: "abc1", data: { metaLevel: 0, type: "line", name: "Draw Line", color: "blue" }, timestamp: 0 });
			storeB.addOperation({ operationId: "abc2", data: { metaLevel: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green" }, timestamp: 1 });
			await waitForSynchronization([storeA, storeB], 2);
			expect(storeA.metaHistory).toEqual([
				{ clientId: 1, operationId: "abc1", data: { metaLevel: 0, type: "line", name: "Draw Line", color: "blue" }, timestamp: 0 },
				{ clientId: 1, operationId: "abc2", data: { metaLevel: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green" }, timestamp: 1 },
			]);
			expect(storeB.metaHistory).toEqual(storeA.metaHistory);
		} finally {
			server.dispose();
		}
	});
	it("should handle updates to continuous operations", async () => {
		const server = new MopaintWebSocketServer({ port: 8283 });
		try {
			const storeA = new HistoryStore({ clientId: 1 });
			const storeB = new HistoryStore({ clientId: 2 });
			// TODO: dispose of these clients
			new MopaintWebSocketClient(storeA, "ws://localhost:8283");
			new MopaintWebSocketClient(storeB, "ws://localhost:8283");
			storeA.addOperation({ operationId: "abc1", data: { metaLevel: 0, type: "brush", name: "Brush", points: [{ x: 5, y: 5 }] }, timestamp: 0 });
			storeA.pushContinuousOperationData("abc1", { points: { x: 10, y: 10 } });
			// is there a race condition here? should I wait for the histories to deeply match, not just their lengths?
			await waitForSynchronization([storeA, storeB], 1);
			expect(storeA.metaHistory).toEqual([
				{ clientId: 1, operationId: "abc1", data: { metaLevel: 0, type: "brush", name: "Brush", points: [{ x: 5, y: 5 }, { x: 10, y: 10 }] }, timestamp: 0 },
			]);
			expect(storeB.metaHistory).not.toBe(storeA.metaHistory); // cheating here should be impossible, can't copy references across the network
			expect(storeB.metaHistory[0]).not.toBe(storeA.metaHistory[0]); // cheating here should be impossible, can't copy references across the network
			expect(storeB.metaHistory[0].data.points[1]).not.toBe(storeA.metaHistory[0].data.points[1]); // cheating here should be impossible, can't copy references across the network
			expect(storeB.metaHistory).toEqual(storeA.metaHistory);
		} finally {
			server.dispose();
		}
	});
});
