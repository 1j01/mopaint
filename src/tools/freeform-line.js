import * as most from "most";

// TODO: move to UI helpers file (or maybe move/keep all tools in one file while I'm iterating on how they work
// so I can rename things across all the tools etc.)
const getPointsFromGesturalEvents = (canvas) => {
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

const tool = {
	// TODO: translatable name and description (and maybe a short name?)
	name: "Pen",
	setupUI: (canvas) => {
		return getPointsFromGesturalEvents(canvas);
	},
	renderOperation: (operation, finish, updateDisplay) => {
		const { swatch } = operation;
		const opCtx = operation.context;
		const pointsStream = operation.gesture;

		const nextWindow = (slidingWindow, x) => slidingWindow.concat(x).slice(-3);

		pointsStream
			.scan(nextWindow, [])
			.skip(3) // includes empty array, so it skips [], [a], [a, b], but not [a, b, c]
			.forEach(([a, b, c]) => {
				// TODO: smooth curves for pen tool
				opCtx.beginPath();
				opCtx.moveTo(a.x, a.y);
				opCtx.lineTo(b.x, b.y);
				opCtx.strokeStyle = swatch;
				opCtx.lineWidth = 5;
				opCtx.lineCap = "round";
				opCtx.stroke();
				updateDisplay();
			})
			.then(finish);
	},
};

export default tool;
