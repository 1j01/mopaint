
// This file contains a sketch of the engine for meta-history.
// It doesn't test any code used by the actual application, yet.

// The meta-history is a list of operations, some of which can act on other operations.
// These are called meta operations. The meta-history is resolved into a linear history
// by applying the meta operations to the operations they target,
// in order of meta level, from most meta to least meta.
// The meta level represents how far removed an operation is from a base operation.

// meta level of 0 = base operation, 1 = meta operation, 2 = meta-meta operation, etc.

// Base operations are things that directly affect the document, like inserting text.
// Undo is a meta operation that negates the effect of another operation.
// Redo is an undo applied to an undo. This makes it a meta-meta operation.

// It is possible for multiple operations to have the same meta level.
// Thus the order of the list matters, and not just the meta level.
// For instance, there may be many base operations, without any meta operations,
// and in that case, there's no need to increase the meta level above 0.
// It is also completely normal to have operations with a lower meta level than the previous operation
// in the list, for example, if the user undoes an operation, then adds a new operation.

// One invariant is that a meta operation's meta level must be greater than the meta level of the operation it targets.

function findTargetOp(metaHistory, targetID, metaOpMetaLevel, removals) {
	// Makes sure it matches a target, and the target is less meta than the meta operation.
	for (const otherOp of metaHistory) {
		if (otherOp.id === targetID) {
			if (otherOp.metaLevel < metaOpMetaLevel) {
				return otherOp;
			} else if (otherOp.metaLevel === metaOpMetaLevel) {
				throw new Error(`target operation '${targetID}' has equal meta level to the meta operation. Meta operations must only target operations less meta than themselves.`);
			} else {
				// This may never happen, since operations will be removed upon application,
				// so it will get the "already applied and thus can't be affected" error instead.
				throw new Error(`target operation '${targetID}' has greater meta level than the meta operation. Meta operations must only target operations less meta than themselves.`);
			}
		}
	}
	for (const { removedOp, removedByOp } of removals) {
		if (removedOp.id === targetID) {
			if (removedByOp) {
				throw new Error(`target operation '${targetID}' was already removed by operation '${removedByOp.id}'.`);
			} else {
				throw new Error(`target operation '${targetID}' was already applied and thus can't be affected.`);
			}
		}
	}
	throw new Error(`target operation '${targetID}' not found.`);
}

function resolveMetaHistory(metaHistory) {

	const maxMetaLevel = metaHistory.reduce((maxMetaLevel, op) => Math.max(maxMetaLevel, op.metaLevel), 0);
	const mutableMH = JSON.parse(JSON.stringify(metaHistory));
	const removals = [];
	// Prevent accidental mutation of the original metaHistory.
	metaHistory = undefined;

	// Note: stopping loop before metaLevel of 0, as at that point it should be resolved.
	// (With most loops counting down you'd want >= 0.)
	for (let metaLevel = maxMetaLevel; metaLevel > 0; metaLevel--) {
		// The for-of loop could miss operations due to mutation without a copy.
		// We don't need a deep clone to handle splicing, just a new array.
		const frozenMH = Object.freeze([...mutableMH]);
		for (const op of frozenMH) {
			if (op.metaLevel === metaLevel) {
				if (op.type === "undo") {
					const targetOp = findTargetOp(mutableMH, op.target, op.metaLevel, removals);
					mutableMH.splice(mutableMH.indexOf(targetOp), 1);
					removals.push({ removedOp: targetOp, removedByOp: op });
				} else if (op.type === "recolor") {
					const targetOp = findTargetOp(mutableMH, op.target, op.metaLevel, removals);
					targetOp.color = op.color;
				}
				mutableMH.splice(mutableMH.indexOf(op), 1);
				removals.push({ removedOp: op, removedByOp: null });
			}
		}
	}
	// Sanity check: make sure all meta operations were applied.
	for (const op of mutableMH) {
		if (op.metaLevel > 0) {
			throw new Error(`meta operation '${op.id}' was left behind, never applied while resolving meta-history.`);
		}
	}
	return mutableMH;
}

describe("resolveMetaHistory", () => {
	it("should resolve meta-history", () => {
		expect(resolveMetaHistory([
			{ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", },
			{ id: "abc2", metaLevel: 1, type: "recolor", name: "Edit Draw Line", target: "abc1", color: "green" },
			{ id: "abc3", metaLevel: 2, type: "undo", name: "Undo Edit Draw Line", target: "abc2" },
			{ id: "abc4", metaLevel: 3, type: "undo", name: "Undo Undo Edit Draw Line", target: "abc3" }, // AKA Redo
			{ id: "abc5", metaLevel: 0, type: "circle", name: "Draw Circle", color: "pink", },
			{ id: "abc6", metaLevel: 0, type: "triangle", name: "Draw Triangle", color: "red", },
			{ id: "abc7", metaLevel: 1, type: "undo", name: "Undo Draw Triangle", target: "abc6" },
		])).toEqual([
			{ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "green", },
			{ id: "abc5", metaLevel: 0, type: "circle", name: "Draw Circle", color: "pink", },
		]);
	});
	it("should throw error if meta operation targets itself", () => {
		expect(() => resolveMetaHistory([
			{ id: "so-meta", metaLevel: 1, type: "undo", name: "Undo Self!?", target: "so-meta" },
		])).toThrowError("target operation 'so-meta' has equal meta level to the meta operation");
	});
	it("should throw error if target operation has higher meta level to meta operation", () => {
		expect(() => resolveMetaHistory([
			{ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", },
			{ id: "abc2", metaLevel: 1, type: "undo", name: "Undo Undo Undo Edit Draw Line", target: "abc4" }, // incorrect metaLevel
			{ id: "abc3", metaLevel: 1, type: "undo", name: "Undo Edit Draw Line", target: "abc2" },
			{ id: "abc4", metaLevel: 2, type: "undo", name: "Undo Undo Edit Draw Line", target: "abc3" }, // AKA Redo
		])).toThrowError("target operation 'abc4' was already applied and thus can't be affected");
	});
	it("should throw error if target operation has equal meta level to meta operation", () => {
		expect(() => resolveMetaHistory([
			{ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", },
			{ id: "abc2", metaLevel: 1, type: "undo", name: "Undo Edit Draw Line", target: "abc1" },
			{ id: "abc3", metaLevel: 2, type: "undo", name: "Undo Undo Edit Draw Line", target: "abc2" }, // AKA Redo
			{ id: "abc4", metaLevel: 2, type: "undo", name: "Undo Undo Undo Edit Draw Line?", target: "abc3" }, // incorrect metaLevel
		])).toThrowError("target operation 'abc3' was already applied and thus can't be affected.");
	});
	it("should throw error if target operation has equal meta level to meta operation, with target after meta", () => {
		expect(() => resolveMetaHistory([
			{ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", },
			{ id: "abc2", metaLevel: 1, type: "undo", name: "Undo Edit Draw Line", target: "abc1" },
			{ id: "abc4", metaLevel: 2, type: "undo", name: "Undo Undo Undo Edit Draw Line?", target: "abc3" }, // incorrect metaLevel
			{ id: "abc3", metaLevel: 2, type: "undo", name: "Undo Undo Edit Draw Line", target: "abc2" }, // AKA Redo
		])).toThrowError("target operation 'abc3' has equal meta level to the meta operation");
	});
	it("should throw error if target operation not found", () => {
		expect(() => resolveMetaHistory([
			{ id: "abc1", metaLevel: 0, type: "line", name: "Draw Line", color: "blue", },
			{ id: "abc3", metaLevel: 2, type: "undo", name: "Undo Edit Draw Line", target: "abc2" },
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
