// const line = (ctx, x1, y1, x2, y2, swatch) => {
// 	// TODO: circle if coords are the same?
// 	// (could approximate by shifting a coord minisculely)
// 	ctx.beginPath();
// 	ctx.moveTo(x1, y1);
// 	ctx.lineTo(x2, y2);
// 	ctx.strokeStyle = swatch;
// 	ctx.lineWidth = 5;
// 	ctx.lineCap = "round";
// 	ctx.stroke();
// };

// import { getStreamOfStreamsOfStartAndEndPoints } from "./ui-helpers.js";
import { getStreamOfStreamsOfPoints } from "./ui-helpers.js";

const tool = {
	name: "Line",
	setupUI: (canvas, endSignal) => {
		return getStreamOfStreamsOfPoints(canvas, endSignal);
	},
	renderOperation: (operation, finish, updateDisplay) => {
		const { swatch } = operation;
		const opCtx = operation.context;
		const pointsStream = operation.pointsStream;

		// const nextWindow = (slidingWindow, x) => slidingWindow.concat(x).slice(-2);

		// TODO: transform the geometry to a line progressively instead of this hack
		// i.e. make renderOperation just render the operation! just draw a line!
		// and have the gesture progressively update an operation
		// (which could also be updated by further gestures like by dragging handles of the two points)
		// At THIS point the operation is essentially conflated with the gesture
		let startPoint;
		pointsStream
			// .scan(nextWindow, [])
			// .skip(2) // includes empty array, so it skips [] and [a] but not [a, b]
			// .forEach(([a, b]) => {
			.forEach((latestPoint) => {
				startPoint = startPoint || latestPoint;
				opCtx.clearRect(0, 0, opCtx.canvas.width, opCtx.canvas.height);
				opCtx.beginPath();
				opCtx.moveTo(startPoint.x, startPoint.y);
				opCtx.lineTo(latestPoint.x, latestPoint.y);
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
