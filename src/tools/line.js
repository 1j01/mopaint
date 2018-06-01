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

import { getStreamOfStreamsOfStartAndEndPoints } from "./ui-helpers.js";

const tool = {
	name: "Line",
	setupUI: (canvas, endSignal) => {
		return getStreamOfStreamsOfStartAndEndPoints(canvas, endSignal);
	},
	renderOperation: (operation, finish, updateDisplay) => {
		const { swatch } = operation;
		const opCtx = operation.context;
		const pointsStream = operation.pointsStream;

		const nextWindow = (slidingWindow, x) => slidingWindow.concat(x).slice(-2);

		pointsStream
			.scan(nextWindow, [])
			.skip(2) // includes empty array, so it skips [] and [a] but not [a, b]
			.forEach(([a, b]) => {
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
