// TODO: evaluate other hashing libraries
// https://brillout.github.io/test-javascript-hash-implementations/
import sha256 from "hash.js/lib/hash/sha/256.js";

const cacheHeuristicPeriod = 5;

const opCanvas = document.createElement("canvas");
const opContext = opCanvas.getContext("2d");

export const draw = ({ documentCanvas, operations, /*thumbnailsByOperation,*/ cache, hashInDocumentByOperation }) => {
	const documentContext = documentCanvas.getContext("2d");

	documentContext.clearRect(0, 0, opCanvas.width, opCanvas.height);

	opCanvas.width = documentCanvas.width;
	opCanvas.height = documentCanvas.height;

	let lastCachedOpIndex = -Infinity; // should this be so extreme? how will this really play into the heuristic? maybe should be -1
	let operationIndex = operations.length - 1;
	for (; operationIndex >= 0; operationIndex--) {
		const operation = operations[operationIndex];
		const operationHash = hashInDocumentByOperation.get(operation);
		if (cache[`document-at-${operationHash}`]) {
			documentContext.drawImage(cache[`document-at-${operationHash}`], 0, 0);
			lastCachedOpIndex = operationIndex;
			break;
		}
	}
	if (operationIndex > -1) {
		// console.log("Starting from checkpoint:", operationIndex);
	} else {
		// console.log("Starting with empty cache");
	}
	operationIndex++;
	const runningHash = sha256();
	for (; operationIndex < operations.length; operationIndex++) {
		const operation = operations[operationIndex];
		runningHash.update(JSON.stringify(operation));
		const operationHash = runningHash.digest("hex");
		opContext.clearRect(0, 0, opCanvas.width, opCanvas.height);
		if (cache[`individual-${operationHash}`]) {
			// console.log("cache hit");
			documentContext.drawImage(cache[`individual-${operationHash}`], 0, 0);
			lastCachedOpIndex = operationIndex;
		} else {
			// opContext.clearRect(0, 0, opCanvas.width, opCanvas.height);
			// console.log("cache miss");
			// console.log({operationIndex, operationHash, operation});
			const { points, tool, swatch } = operation;

			// TODO: integrate timing into heuristic
			// const timeBefore = performance.now();
			tool.drawFromPoints(opContext, points, swatch, documentContext);
			// const timeAfter = performance.now();
			// const toolTime = timeAfter - timeBefore;

			documentContext.drawImage(opCanvas, 0, 0);

			hashInDocumentByOperation.set(operation, operationHash);

			// fill the cache
			if (!operation.updatingContinuously) {
				if (operationIndex >= lastCachedOpIndex + cacheHeuristicPeriod) {
					cache[`document-at-${operationHash}`] = document.createElement("canvas");
					cache[`document-at-${operationHash}`].width = opCanvas.width;
					cache[`document-at-${operationHash}`].height = opCanvas.height;
					cache[`document-at-${operationHash}`].getContext("2d").drawImage(documentCanvas, 0, 0);
					lastCachedOpIndex = operationIndex;
				}
				// cache[`individual-${operationHash}`] = document.createElement("canvas");
				// cache[`individual-${operationHash}`].width = opCanvas.width;
				// cache[`individual-${operationHash}`].height = opCanvas.height;
				// cache[`individual-${operationHash}`].getContext("2d").drawImage(opCanvas, 0, 0);
			}

			// let thumbnail = thumbnailsByOperation.get(operation);
			// if (thumbnail) {
			// 	thumbnail.getContext("2d").clearRect(0, 0, 64, 64);
			// } else {
			// 	thumbnail = document.createElement("canvas");
			// 	thumbnail.width = 64;
			// 	thumbnail.height = 64;
			// }
			// // TODO: keep thumbnail proportional
			// // can reuse code in ToolPreview.js
			// thumbnail.getContext("2d").drawImage(opCanvas, 0, 0, 64, 64);
			// thumbnailsByOperation.set(operation, thumbnail);

			// TODO: cache invalidation
			// // console.log("invalidate", operations, operationIndex + 1);
			// operations.slice(operationIndex + 1).forEach((operation)=> {
			// 	// TODO: unless self-contained
			// 	// console.log(thumbnailsByOperation.has(operation), thumbnailsByOperation);
			// 	thumbnailsByOperation.delete(operation);
			// 	delete cache[`individual-${hashInDocumentByOperation}`.get(operation)];
			// });
		}
	}
};
