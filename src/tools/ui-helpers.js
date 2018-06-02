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

	// TODO: touch support
	return most
		.fromEvent("mousedown", canvas)
		.until(endSignal) // TODO: clean up event handlers in a cleaner way
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
						// TODO: maybe .filter((event)=> event.which === 1)? *maybe*
						.tap(uncaptureCursor)
				)
				.map(toCanvasCoords);
		});
};

const getStreamOfStreamsOfLines = (canvas, endSignal) => {
	return getStreamOfStreamsOfPoints(canvas, endSignal)
		.tap((val) => console.log("(in getStreamOfStreamsOfLines)", val))
		.map((pointsStream) => {
			let firstPoint; // is this anti-functional or whatever? having state here?
			return pointsStream.map((point) => {
				firstPoint = firstPoint || point;
				return [firstPoint, point];
			});
		});
};

export { getStreamOfStreamsOfPoints, getStreamOfStreamsOfLines };
