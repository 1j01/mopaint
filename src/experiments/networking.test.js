/* global it:false expect:false test:false describe:false */

import { Client, InProcessPeerParty } from "./networking";

describe("Client + InProcessPeerParty", () => {
	it("should allow communication", () => {
		const clientA = new Client();
		const clientB = new Client();
		const party = new InProcessPeerParty();
		party.addPeer(clientA);
		party.addPeer(clientB);
		clientA.addOperation({ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", timestamp: 0 });
		clientB.addOperation({ id: "abc2", metaLevel: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green", timestamp: 1 });
		expect(clientA.metaHistory).toEqual([
			{ clientId: 1, id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", timestamp: 0 },
			{ clientId: 2, id: "abc2", metaLevel: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green", timestamp: 1 },
		]);
		// expect(clientA.computeLinearHistory()).toEqual([
		// 	{ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "green", },
		// ]);
		party.dispose();
	});
});

