import sha256 from "hash.js/lib/hash/sha/256";

export const draw = ({documentCanvas, displayCanvas, opCanvas, operations, thumbnailsByOperation, cache, hashInDocumentByOperation})=> {
	const documentContext = documentCanvas.getContext("2d");
	const opCtx = opCanvas.getContext("2d");
	const displayCtx = displayCanvas.getContext("2d");

	documentContext.clearRect(0, 0, opCanvas.width, opCanvas.height);

	const runningHash = sha256();
	operations.forEach((operation, operationIndex) => {
		runningHash.update(JSON.stringify(operation));
		const operationHash = runningHash.digest("hex");
		opCtx.clearRect(0, 0, opCanvas.width, opCanvas.height);
		if (cache[operationHash]) {
			// console.log("cache hit");
			documentContext.drawImage(cache[operationHash], 0, 0);
		} else {
			// opCtx.clearRect(0, 0, opCanvas.width, opCanvas.height);
			// console.log("cache miss");
			const { points, tool, swatch } = operation;
			const startPos = points[0];
			const lastPos = points[points.length - 1];
			if (tool.drawShape) {
				tool.drawShape(
					opCtx,
					startPos.x,
					startPos.y,
					lastPos.x,
					lastPos.y,
					swatch
				);
			}
			if (tool.drawSegmentOfPath) {
				// TODO: allow for smoothing (rather than just plain segments)
				for (let i1 = 0, i2 = 1; i2 < points.length; i1 += 1, i2 += 1) {
					tool.drawSegmentOfPath(
						opCtx,
						points[i1].x,
						points[i1].y,
						points[i2].x,
						points[i2].y,
						swatch
					);
				}
			}
			if (tool.click) {
				tool.click(opCtx, startPos.x, startPos.y, swatch, documentContext);
			}

			documentContext.drawImage(opCanvas, 0, 0);

			hashInDocumentByOperation.set(operation, operationHash);

			// fill the cache
			if (!operation.updatingContinously) {
				cache[operationHash] = document.createElement("canvas");
				cache[operationHash].width = opCanvas.width;
				cache[operationHash].height = opCanvas.height;
				cache[operationHash].getContext("2d").drawImage(opCanvas, 0, 0);
			}

			// TODO: optimize: use existing canvas if it exists (clear and update it)
			const thumbnail = document.createElement("canvas");
			thumbnail.width = 64;
			thumbnail.height = 64;
			// TODO: keep thumbnail proportional
			// can reuse code in ToolPreview.js
			thumbnail.getContext("2d").drawImage(opCanvas, 0, 0, 64, 64);
			thumbnailsByOperation.set(operation, thumbnail);

			// invalidate the cache for any future operations
			// TODO: need to invalidate "redos"
			// // console.log("invalidate", operations, operationIndex + 1);
			// operations.slice(operationIndex + 1).forEach((operation)=> {
			// 	// TODO: unless self-contained
			// 	// console.log(thumbnailsByOperation.has(operation), thumbnailsByOperation);
			// 	thumbnailsByOperation.delete(operation);
			// 	delete cache[hashInDocumentByOperation.get(operation)];
			// });
		}
	});

	displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
	displayCtx.drawImage(documentCanvas, 0, 0);
}

/*
export function render(mopaintDocument, canvas, inputs) {
	const ctx = canvas.getContext("2d");

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	const runningHash = sha256();
	mopaintDocument.operations.forEach((operation, operationIndex) => {
		runningHash.update(JSON.stringify(operation));
		const operationHash = runningHash.digest("hex");

		operation.exec(ctx);
		
		this.hashInDocumentByOperation.set(operation, operationHash);
	});

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(documentCanvas, 0, 0);
}

export function overlayOnPage(mopaintDocument, elements) {
	const canvas = document.createElement("canvas");

	const makeFrameInputs = ()=> {
		const rects = {};
		for (let id, element of elements) {
			const {left, top, right, bottom} = element.getBoundingClientRect();
			const x = left, y = top, width = right - left, height = bottom - top;
			rects[id] = {x, y, width, height};
		}
		const pageWidth = innerWidth, pageHeight = innerHeight;
		const inputs = {rects, pageWidth, pageHeight};
		return inputs;
	};

	canvas.style.pointerEvents = "none";
	canvas.style.position = "fixed";
	canvas.style.left = "0";
	canvas.style.top = "0";
	document.body.appendChild(canvas);
	
	const animate = ()=> {
		const inputs = makeFrameInputs();

		canvas.width = inputs.pageWidth;
		canvas.height = inputs.pageHeight;

		render(mopaintDocument, canvas, inputs);

		requestAnimationFrame(animate);
	};
	requestAnimationFrame(animate);
}
*/
