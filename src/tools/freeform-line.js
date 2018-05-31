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
	return most
		.fromEvent("mousedown", canvas)
		.tap(preventDefault)
		.tap(removeSelection)
		.map(() => {
			return most
				.fromEvent("mousemove", canvas)
				.until(most.fromEvent("mouseup", window))
				.map(toCanvasCoords);
		});
};

const tool = {
	// TODO: translatable name and description (and maybe a short name?)
	name: "Pen",
	setup: (canvas, opCtx, makeAction, updateDisplay, swatch) => {
		const gesturesStream = getPointsFromGesturalEvents(canvas);

		gesturesStream.observe((pointsStream) => {
			const nextWindow = (slidingWindow, x) =>
				slidingWindow.concat(x).slice(-3);

			pointsStream
				.scan(nextWindow, [])
				.skip(3) // includes []
				.forEach(([a, b, c]) => {
					// TODO: smooth curves
					opCtx.beginPath();
					opCtx.moveTo(a.x, a.y + Math.random() * 50);
					opCtx.lineTo(b.x, b.y + Math.random() * 50);
					// TODO: separate UI and drawing code with data in the middle
					// so we can update swatch when the user selects a swatch,
					// including after the fact (after the user drew the line)
					opCtx.strokeStyle = swatch;
					opCtx.lineWidth = 5;
					opCtx.lineCap = "round";
					opCtx.stroke();
					updateDisplay();
				})
				.then(() => {
					makeAction();
				});
		});
	},
};

export default tool;
