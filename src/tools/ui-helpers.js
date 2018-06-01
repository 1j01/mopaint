import * as most from "most";

const getStreamOfStreamsOfPoints = (canvas, endSignal) => {
	const toCanvasCoords = (event) => {
		const rect = canvas.getBoundingClientRect();
		return {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
		};
	};
	const preventDefault = (event) => {
		event.preventDefault();
	};
	const removeSelection = () => {
		const sel = window.getSelection
			? window.getSelection()
			: document.selection;
		if (sel) {
			if (sel.removeAllRanges) {
				sel.removeAllRanges();
			} else if (sel.empty) {
				sel.empty();
			}
		}
	};

	const captureCursor = (event) => {
		if (event.target.setCapture) {
			event.target.setCapture();
		} else {
			document.body.classList.add("cursor-override-DrawingCanvas");
		}
	};
	const uncaptureCursor = () => {
		document.body.classList.remove("cursor-override-DrawingCanvas");
	};

	// TODO: make sure event handlers are cleaned up
	// TODO: touch support
	return most
		.fromEvent("mousedown", canvas)
		.until(endSignal)
		.filter((event) => event.which === 1)
		.tap(preventDefault)
		.tap(removeSelection)
		.tap(captureCursor)
		.map(() => {
			return most
				.fromEvent("mousemove", window)
				.until(
					most
						.fromEvent("mouseup", window)
						// TODO: maybe .filter((event)=> event.which === 1)? maybe.
						.tap(uncaptureCursor)
				)
				.map(toCanvasCoords);
		});
};

const firstAndLast = (stream) =>
	most.mergeArray([
		most.fromPromise(stream.reduce((first, val) => first || val)),
		most.fromPromise(stream.reduce((last, val) => val)),
	]);

const getStreamOfStreamsOfStartAndEndPoints = (canvas, endSignal) =>
	getStreamOfStreamsOfPoints(canvas, endSignal).map(firstAndLast);

export { getStreamOfStreamsOfPoints, getStreamOfStreamsOfStartAndEndPoints };
