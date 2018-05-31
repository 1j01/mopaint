import * as most from "most";

// const name = "Freeform Line"; // or Pen

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
		// console.log("preventDefault");
		event.preventDefault();
	};
	const removeSelection = () => {
		// console.log("removeSelection");
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

// this shouldn't necessarily be a class
// and I'm probably not doing reactive programming good
// or any of this
// class FreeformLine {
// 	constructor(){
// 		this.points = [];
// 	}
// 	addListeners(canvas){
const tool = {
	name: "Pen",
	setup: (canvas, opCtx, makeAction, updateDisplay, swatch) => {
		const gesturesStream = getPointsFromGesturalEvents(canvas);
		// console.log("gesturesStream", gesturesStream);

		gesturesStream.observe((pointsStream) => {
			// console.log("pointsStream", pointsStream);

			// const opCanvas = document.createElement("canvas");
			// const opCtx = opCanvas.getContext("2d");

			// pointsStream.observe((point)=> {
			// 	// this.points.push(point);
			// 	// this.drawSegment();
			// });
			// .on end? on mouseup
			// TODO: create action from subsection of the canvas
			// const action = new ImageAction(
			// 	opCtx,
			// 	0,
			// 	0,
			// 	selectedTool,
			// 	selectedTool.name
			// );
			// applyAction/undoable(action);

			const nextWindow = (slidingWindow, x) =>
				slidingWindow.concat(x).slice(-3);

			pointsStream
				.scan(nextWindow, [])
				// .take(10)
				.skip(3) // includes []
				.forEach(([a, b, c]) => {
					// console.log(a, b, c);
					// TODO: smooth curves
					opCtx.beginPath();
					opCtx.moveTo(a.x, a.y + Math.random() * 50);
					opCtx.lineTo(b.x, b.y + Math.random() * 50);
					// console.log(swatch);
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
	// drawSegment() {
	// 	if(this.points.length >= 2){

	// 	}
	// }
};
// TODO: translatable name and description (and maybe a short name?)
// can't set name of a function, could name "name" something else
// FreeformLine.name = "Pen";

// export default {
// 	name,
// 	draw: (ctx, points)=> {

// 	}
// };

// export default FreeformLine;
export default tool;
