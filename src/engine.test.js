
function findTargetOp(metaHistory, targetID, metaOpMHI) {
	// Makes sure it matches a target, and the target is less meta than the meta operation.
	for (const otherOp of metaHistory) {
		if (otherOp.id === targetID) {
			if (otherOp.mhi < metaOpMHI) {
				return otherOp;
			} else {
				throw new Error(`target operation '${targetID}' has equal or higher meta-history index than meta operation. Operations must only target operations less meta than themselves.`);
			}
		}
	}
	throw new Error(`target operation '${targetID}' not found.`);
}

function resolveMetaHistory(metaHistory) {

	const maxMHI = metaHistory.reduce((maxMHI, op) => Math.max(maxMHI, op.mhi), 0);
	const mutableMH = JSON.parse(JSON.stringify(metaHistory));

	// Note: stopping loop before mhi of 0, as at that point it should be resolved.
	// (With most loops counting down you'd want >= 0.)
	for (let mhi = maxMHI; mhi > 0; mhi--) {
		for (const op of mutableMH) {
			if (op.mhi === mhi) {
				// console.log(op, mhi);
				// TODO: handle all op types?
				if (op.type === "undo") {
					const targetOp = findTargetOp(mutableMH, op.target, op.mhi);
					console.log("undoing", targetOp);
					mutableMH.splice(mutableMH.indexOf(targetOp), 1);
				} else if (op.type === "recolor") {
					const targetOp = findTargetOp(mutableMH, op.target, op.mhi);
					console.log("recoloring", targetOp);
					targetOp.color = op.color;
				}
				mutableMH.splice(mutableMH.indexOf(op), 1);
			}
		}
	}
	return mutableMH;
}

describe("resolveMetaHistory", () => {
	it("should resolve meta-history", () => {
		expect(resolveMetaHistory([
			{ id: "abc1", mhi: 0, type: "line", name: "Draw Line", color: "blue", },
			{ id: "abc2", mhi: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green" },
			{ id: "abc3", mhi: 2, type: "undo", name: "Undo Edit Draw Line", target: "abc2" },
			{ id: "abc4", mhi: 3, type: "undo", name: "Undo Undo Edit Draw Line", target: "abc3" }, // AKA Redo
			{ id: "abc5", mhi: 0, type: "circle", name: "Draw Circle", color: "pink", },
			{ id: "abc6", mhi: 0, type: "triangle", name: "Draw Triangle", color: "red", },
			{ id: "abc7", mhi: 1, type: "undo", name: "Undo Draw Triangle", target: "abc6" },
		])).toEqual([
			{ id: "abc1", mhi: 0, type: "line", name: "Draw Line", color: "green", },
			{ id: "abc5", mhi: 0, type: "circle", name: "Draw Circle", color: "pink", },
		]);
	});
	it("should throw error if meta operation targets itself", () => {
		expect(() => resolveMetaHistory([
			{ id: "so-meta", mhi: 1, type: "undo", name: "Undo Self!?", target: "so-meta" },
		])).toThrowError("target operation 'so-meta' has equal or higher meta-history index than meta operation");
	});
	it("should throw error if target operation has equal or higher meta-history index than meta operation", () => {
		expect(() => resolveMetaHistory([
			{ id: "abc1", mhi: 0, type: "line", name: "Draw Line", color: "blue", },
			{ id: "abc2", mhi: 1, type: "undo", name: "Undo Edit Draw Line", target: "abc1" },
			{ id: "abc3", mhi: 2, type: "undo", name: "Undo Undo Edit Draw Line", target: "abc2" }, // AKA Redo
			{ id: "abc4", mhi: 2, type: "undo", name: "Undo Undo Undo Edit Draw Line?", target: "abc3" }, // incorrect mhi
		])).toThrowError("target operation 'abc3' has equal or higher meta-history index than meta operation");
	});
	it("should throw error if target operation not found", () => {
		expect(() => resolveMetaHistory([
			{ id: "abc1", mhi: 0, type: "line", name: "Draw Line", color: "blue", },
			{ id: "abc3", mhi: 2, type: "undo", name: "Undo Edit Draw Line", target: "abc2" },
		])).toThrowError("target operation 'abc2' not found");
	});
});

// function compute({ program, cache, goalNode }) {
// 	const steps = resolveMetaHistory(program);
// 	for (const step of step) {
// 		step.execute();
// 	}
// }

function squashHistory({ opsByID, cache, stepsToDelete }) {

	// TODO: what does it mean to delete history entry without deleting parent?
	// should it just implicitly delete isolated parents?

	let computeNeeded = false;
	const dependentOpEntries = Object.entries(opsByID).filter(([id, op]) =>
		stepsToDelete.includes(id)
	);
	const dependencyReplacements = dependentOpEntries.map(([id, oldOp]) => {
		let value = cache[id];
		// overcomplicated: this doesn't need to be in here
		// can just use cache; cache can reference same objects, so it's not using much extra memory
		// if (!value) {
		// 	if (oldOp.type === "array" || oldOp.type === "data") {
		// 		value = oldOp.data;
		// 	}
		// }
		if (value) {
			const newOp = { value };
			newOp.type = newOp.value instanceof Array ? "array" : "data";
			return { id, oldOp, newOp };
		} else {
			computeNeeded = true;
		}
	});
	if (computeNeeded) {
		return { computeNeeded: true };
	}
	// return dependencyReplacements;
	for (const { id, oldOp, newOp } of dependencyReplacements) {
		delete opsByID[id];
		delete cache[id];
	}
	return { computeNeeded: false };

	// TODO: non-destructive (DDDBD), prereq: meta-history

	// return {
	// 	permanentlyDelete: function () {

	// 	}
	// };
}


function loadImageFile(bytes) {
	return bytes.slice(4);
}
function crop(array, x1, x2) {
	return array.slice(x1, x2);
}



/* global it:false expect:false test:false describe:false */
// describe("compute", () => {
// 	test("should use cache", () => {
// 		const program = ...;
// 		expect(compute(program, { someCachedID: "some cached value" })).toEqual("some cached value");
// 	});
// });

describe("history deletion", () => {
	const getTestProgram = () => {
		return {
			imageFileData: {
				type: "array",
				data: [/*magic bytes (not a real format)*/0, 0, 0, 0, /*pixel data*/255, 255, 255, 255, 255, 0, 255, 255],
			},
			imageData: {
				type: "call",
				function: loadImageFile,
				inputs: {
					imageFileData: "imageFileData",
				},
				// outputs: {
				// imageData: "imageData",
				// },
			},
			croppedImageData: {
				type: "call",
				function: crop,
				inputs: {
					imageData: "imageData",
					x1: 4,
					x2: 8,
				},
				// outputs: {
				// croppedImageData: "croppedImageData",
				// },
			},
		};
	};

	test("when cache is not ready, returns computeNeeded: true", () => {
		var opsByID = getTestProgram();
		const stepsToDelete = [
			"imageFileData",
			"imageData",
		];
		expect(squashHistory({
			opsByID: getTestProgram(),
			cache: {},
			stepsToDelete
		}))
			.toEqual({ computeNeeded: true });

		expect(squashHistory({
			opsByID,
			cache: {
				imageData: [255, 255, 255, 255, 255, 0, 255, 255],
			},
			stepsToDelete,
		}))
			.toEqual({ computeNeeded: true });
	});
	test.todo("when cache is ready, deletes history", /*() => {
		var opsByID = getTestProgram();
		expect(squashHistory({
			opsByID: getTestProgram(),
			cache: {
				croppedImageData: [255, 0, 255, 255],
			},
			stepsToDelete: [
				"imageFileData",
				"imageData",
			],
		}))
			.toEqual({ computeNeeded: false });
		expect(opsByID).toEqual({
			croppedImageData: {
				type: "array",
				data: [255, 0, 255, 255],
			},
		});
	}*/);
	test.todo("when parent but not parent of parent is specified for deletion, ???????", /*() => {
		var opsByID = getTestProgram();
		expect(squashHistory({
			opsByID: getTestProgram(),
			cache: {
				croppedImageData: [255, 0, 255, 255],
			},
			stepsToDelete: [
				"imageFileData",
			],
		}))
			.toEqual({ computeNeeded: false });
		expect(opsByID).toEqual({
			croppedImageData: {
				type: "array",
				data: [255, 0, 255, 255],
			},
		});
	}*/);
});
