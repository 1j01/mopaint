import { Client, InProcessPeerParty, MopaintWebSocketClient } from "./networking.js";
import { MopaintWebSocketServer } from "./server.js";

describe("Client + InProcessPeerParty", () => {
	it("should allow communication", () => {
		const clientA = new Client({ clientId: 1 });
		const clientB = new Client({ clientId: 2 });
		const party = new InProcessPeerParty();
		party.addPeer(clientA);
		party.addPeer(clientB);
		clientA.addOperation({ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", timestamp: 0 });
		clientB.addOperation({ id: "abc2", metaLevel: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green", timestamp: 1 });
		expect(clientA.metaHistory).toEqual([
			{ clientId: 1, id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", timestamp: 0 },
			{ clientId: 2, id: "abc2", metaLevel: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green", timestamp: 1 },
		]);
		expect(clientB.metaHistory).toEqual(clientA.metaHistory);

		// expect(clientA.computeLinearHistory()).toEqual([
		// 	{ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "green", },
		// ]);
		party.dispose();
	});
	it("should order operations according to timestamp", () => {
		const clientA = new Client({ clientId: 1 });
		const clientB = new Client({ clientId: 2 });
		const party = new InProcessPeerParty();
		party.addPeer(clientA);
		party.addPeer(clientB);
		clientA.addOperation({ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", timestamp: 1 });
		clientB.addOperation({ id: "abc2", metaLevel: 0, type: "line", name: "Draw Line", color: "yellow", timestamp: 0 });
		expect(clientA.metaHistory).toEqual([
			{ clientId: 2, id: "abc2", metaLevel: 0, type: "line", name: "Draw Line", color: "yellow", timestamp: 0 },
			{ clientId: 1, id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", timestamp: 1 },
		]);
		expect(clientB.metaHistory).toEqual(clientA.metaHistory);
		party.dispose();
	});
	it("should order operations according to clientId and order received if timestamps are equal", () => {
		const clientA = new Client({ clientId: 1 });
		const clientB = new Client({ clientId: 2 });
		const party = new InProcessPeerParty();
		party.addPeer(clientA);
		party.addPeer(clientB);
		clientA.addOperation({ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", timestamp: 1 });
		clientB.addOperation({ id: "abc2", metaLevel: 0, type: "line", name: "Draw Line", color: "yellow", timestamp: 1 });
		clientB.addOperation({ id: "abc3", metaLevel: 0, type: "line", name: "Draw Line", color: "green", timestamp: 1 });
		clientA.addOperation({ id: "abc4", metaLevel: 0, type: "line", name: "Draw Line", color: "red", timestamp: 1 });
		expect(clientA.metaHistory).toEqual([
			{ clientId: 1, id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", timestamp: 1 },
			{ clientId: 1, id: "abc4", metaLevel: 0, type: "line", name: "Draw Line", color: "red", timestamp: 1 },
			{ clientId: 2, id: "abc2", metaLevel: 0, type: "line", name: "Draw Line", color: "yellow", timestamp: 1 },
			{ clientId: 2, id: "abc3", metaLevel: 0, type: "line", name: "Draw Line", color: "green", timestamp: 1 },
		]);
		expect(clientB.metaHistory).toEqual(clientA.metaHistory);
		party.dispose();
	});
	it("should handle updates to continuous operations", () => {
		const clientA = new Client({ clientId: 1 });
		const clientB = new Client({ clientId: 2 });
		const party = new InProcessPeerParty();
		party.addPeer(clientA);
		party.addPeer(clientB);
		clientA.addOperation({ operationId: "abc1", metaLevel: 0, type: "brush", name: "Brush", points: [{ x: 5, y: 5 }], timestamp: 0 });
		clientA.pushContinuousOperationData("abc1", { points: { x: 10, y: 10 } });
		expect(clientA.metaHistory).toEqual([
			{ clientId: 1, operationId: "abc1", metaLevel: 0, type: "brush", name: "Brush", points: [{ x: 5, y: 5 }, { x: 10, y: 10 }], timestamp: 0 },
		]);
		expect(clientB.metaHistory).not.toBe(clientA.metaHistory); // must not cheat by copying the reference
		expect(clientB.metaHistory[0]).not.toBe(clientA.metaHistory[0]); // must not cheat by copying the reference
		expect(clientB.metaHistory).toEqual(clientA.metaHistory); // should match though

		// expect(clientA.computeLinearHistory()).toEqual([
		// 	{ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "green", },
		// ]);
		party.dispose();
	});
});

/**
 * @param {Client[]} clients
 * @param {number} expectedMetaHistoryLength
 * @returns {Promise<void>}
 */
const waitForSynchronization = (clients, expectedMetaHistoryLength) => {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(new Error(`Synchronization timed out. Clients have metaHistory lengths that aren't ${expectedMetaHistoryLength}: ${clients.map((client) => `client '${client.clientId}' has ${client.metaHistory.length}`).join(", ")}`));
		}, 4000);

		const checkSynchronization = () => {
			if (
				clients.every((client) => client.metaHistory.length === expectedMetaHistoryLength)
				// &&
				// JSON.stringify(clientA.metaHistory) === JSON.stringify(clientB.metaHistory)
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


describe("Client + MopaintWebSocketServer + MopaintWebSocketClient", () => {
	it("should allow communication", async () => {
		const server = new MopaintWebSocketServer({ port: 8283 });
		try {
			const clientA = new Client({ clientId: 1 });
			const clientB = new Client({ clientId: 2 });
			// TODO: dispose of these clients
			new MopaintWebSocketClient(clientA, "ws://localhost:8283");
			new MopaintWebSocketClient(clientB, "ws://localhost:8283");
			clientA.addOperation({ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", timestamp: 0 });
			clientB.addOperation({ id: "abc2", metaLevel: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green", timestamp: 1 });
			await waitForSynchronization([clientA, clientB], 2);
			expect(clientA.metaHistory).toEqual([
				{ clientId: 1, id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", timestamp: 0 },
				{ clientId: 2, id: "abc2", metaLevel: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green", timestamp: 1 },
			]);
			expect(clientB.metaHistory).toEqual(clientA.metaHistory);
		} finally {
			server.dispose();
		}
	});
	it("clients with the same ID should not rebroadcast each others' messages", async () => {
		const server = new MopaintWebSocketServer({ port: 8283 });
		try {
			const clientA = new Client({ clientId: 1 });
			const clientB = new Client({ clientId: 1 });
			// TODO: dispose of these clients
			new MopaintWebSocketClient(clientA, "ws://localhost:8283");
			new MopaintWebSocketClient(clientB, "ws://localhost:8283");
			clientA.addOperation({ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", timestamp: 0 });
			clientB.addOperation({ id: "abc2", metaLevel: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green", timestamp: 1 });
			await waitForSynchronization([clientA, clientB], 2);
			expect(clientA.metaHistory).toEqual([
				{ clientId: 1, id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", timestamp: 0 },
				{ clientId: 1, id: "abc2", metaLevel: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green", timestamp: 1 },
			]);
			expect(clientB.metaHistory).toEqual(clientA.metaHistory);
		} finally {
			server.dispose();
		}
	});
	it("should handle updates to continuous operations", async () => {
		const server = new MopaintWebSocketServer({ port: 8283 });
		try {
			const clientA = new Client({ clientId: 1 });
			const clientB = new Client({ clientId: 2 });
			// TODO: dispose of these clients
			new MopaintWebSocketClient(clientA, "ws://localhost:8283");
			new MopaintWebSocketClient(clientB, "ws://localhost:8283");
			clientA.addOperation({ operationId: "abc1", metaLevel: 0, type: "brush", name: "Brush", points: [{ x: 5, y: 5 }], timestamp: 0 });
			clientA.pushContinuousOperationData("abc1", { points: { x: 10, y: 10 } });
			// is there a race condition here? should I wait for the histories to deeply match, not just their lengths?
			await waitForSynchronization([clientA, clientB], 1);
			expect(clientA.metaHistory).toEqual([
				{ clientId: 1, operationId: "abc1", metaLevel: 0, type: "brush", name: "Brush", points: [{ x: 5, y: 5 }, { x: 10, y: 10 }], timestamp: 0 },
			]);
			expect(clientB.metaHistory).not.toBe(clientA.metaHistory); // must not cheat by copying the reference
			expect(clientB.metaHistory[0]).not.toBe(clientA.metaHistory[0]); // must not cheat by copying the reference
			expect(clientB.metaHistory).toEqual(clientA.metaHistory); // should match though
		} finally {
			server.dispose();
		}
	});
});
