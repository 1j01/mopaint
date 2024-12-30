// This is just a sketch of what an API for overlaying a MoPaint document on a page might look like.
// Use case: decorating web pages with brush strokes drawn in relation to the position of elements on the page.
// This is not a proof of concept implementation.

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
		for (let [id, element] of elements) {
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
