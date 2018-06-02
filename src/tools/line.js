import { getStreamOfStreamsOfLines } from "./ui-helpers.js";

const tool = {
	name: "Line",
	setupUI: (canvas, endSignal) => {
		return getStreamOfStreamsOfLines(canvas, endSignal);
	},
	renderOperation: (operation, finish, updateDisplay) => {
		const { swatch } = operation;
		const opCtx = operation.context;
		const linesStream = operation.uiData;

		// TODO: the operation should be just the line
		// and you should be able to create that with a gesture, (and adjust it afterwards)
		// and while you're making the gesture it should update the operation progressively
		// (possibly with something that's also 'operations', or something that's maybe lighter,
		// just like JSON deltas - but maybe the other kind could be JSON deltas in some way as well, idk;
		// I'm not actually thinking about that right now, so... grain of salt I guess)
		linesStream
			.forEach((latestLine) => {
				const [startPoint, endPoint] = latestLine;
				opCtx.clearRect(0, 0, opCtx.canvas.width, opCtx.canvas.height);

				// TODO: circle if coords are the same?
				// (could approximate by shifting a coord minisculely)
				opCtx.beginPath();
				opCtx.moveTo(startPoint.x, startPoint.y);
				opCtx.lineTo(endPoint.x, endPoint.y);
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
