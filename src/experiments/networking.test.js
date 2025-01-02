import { Client, InProcessPeerParty, WebSocketClient } from "./networking";
import { WebSocketServer } from "./server";

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


describe("Client + WebSocketServer + WebSocketClient", () => {
	it("should allow communication", async () => {
		const server = new WebSocketServer({ port: 8283 });
		try {
			const clientA = new Client({ clientId: 1 });
			const clientB = new Client({ clientId: 2 });
			// TODO: dispose of these clients
			new WebSocketClient(clientA, "ws://localhost:8283");
			new WebSocketClient(clientB, "ws://localhost:8283");
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
});
