
export function squashHistory({ opsByID, cache, stepsToDelete }) {

	// TODO: what does it mean to delete history entry without deleting parent?
	// should it just implicitly delete isolated parents?

	let computeNeeded = false;
	// eslint-disable-next-line no-unused-vars
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
	for (const { id /*, oldOp, newOp*/ } of dependencyReplacements) {
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
