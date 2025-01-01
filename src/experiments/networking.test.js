/* global it:false expect:false test:false describe:false */

import { Client, InMemoryComms } from "./networking";

describe("InMemoryComms", () => {
	it("should allow communication", () => {
		const commsA = new InMemoryComms();
		const commsB = new InMemoryComms();
		const clientA = new Client(commsA);
		const clientB = new Client(commsB);
		commsA.otherComms.push(commsB);
		commsB.otherComms.push(commsA);
		clientA.addOperation({ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", });
		clientB.addOperation({ id: "abc2", metaLevel: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green" });
		expect(clientA.metaHistory).toEqual([
			{ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", },
			{ id: "abc2", metaLevel: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green" },
		]);
		// expect(clientA.computeLinearHistory()).toEqual([
		// 	{ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "green", },
		// ]);
	});
});

