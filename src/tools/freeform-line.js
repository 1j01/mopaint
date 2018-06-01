import { getStreamOfStreamsOfPoints } from "./ui-helpers.js";

const tool = {
	// TODO: translatable name and description (and maybe a short name?)
	name: "Pen",
	setupUI: (canvas, endSignal) => {
		return getStreamOfStreamsOfPoints(canvas, endSignal);
	},
	renderOperation: (operation, finish, updateDisplay) => {
		const { swatch } = operation;
		const opCtx = operation.context;
		const pointsStream = operation.pointsStream;

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
