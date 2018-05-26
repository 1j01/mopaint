import line from "./line.js";
import circle from "./circle.js";
import rectangle from "./rectangle.js";
import fill from "./fill.js";
import mirrorReflect from "./mirror-symmetry.js";
import rotationallyReflect from "./rotational-symmetry.js";

const tools = {
	"Freeform Line": {
		// maybe this should be more like
		// from: "lastPos", to: "pos", draw: (...)=>
		// or make this less framework-like/abstract at this level
		// and just have it register event handlers
		// and have a function for transforming mouse coordinates to canvas coordinates, etc.
		drawSegmentOfPath: line,
	},
	Line: {
		drawShape: line,
	},
	"Freeform Circles": {
		drawSegmentOfPath: circle,
	},
	Circle: {
		drawShape: circle,
	},
	Rectangle: {
		drawShape: rectangle,
	},
	Fill: {
		// these UI function signatures are pretty arbitrary and would only get worse
		// as time goes on and I maintain backwards compatibility out of laziness and add things to the end
		// and it doesn't help that there's this layer of indirection
		click: function(opCtx, x, y, swatch, documentCtx) {
			opCtx.drawImage(documentCtx.canvas, 0, 0);
			fill(opCtx, x, y, swatch);
		},
	},
};

// TODO: allow the USER to compose tools (dynamically)
const pointModifiers = [
	{
		prefix: "Mirror Symmetric ",
		pointToPoints: mirrorReflect,
	},
	{
		prefix: "Rotationally Symmetric ",
		pointToPoints: rotationallyReflect,
	},
];
// TODO: for now I've gone with relying on a generic/shared API for tools that take certain kinds of geometry
// something better might involve streams of events / geometry
// maybe something like
// var normalGesture = new Gesture
// var mirrorGesture = new Gesture
// events --> normalGesture
// events.map(mirrorPoint) --> mirrorGesture
// (maybe "gesture" should be reserved for direct-from-user gestures; maybe it should be called ToolOperation or something)

pointModifiers.forEach((modifier) => {
	Object.keys(tools).forEach((key) => {
		const originalTool = tools[key];
		const newKey = modifier.prefix + key;

		// if (originalTool.drawSegmentOfPath || originalTool.drawShape || originalTool.click) {
		// TODO: DRY and rework all this, make all this unnecessary and obselete
		if (originalTool.drawSegmentOfPath) {
			const newTool = (tools[newKey] = {});
			newTool.drawSegmentOfPath = (ctx, x1, y1, x2, y2, swatch) => {
				const starts = modifier.pointToPoints(x1, y1, ctx);
				const ends = modifier.pointToPoints(x2, y2, ctx);
				for (let i = 0; i < starts.length; i++) {
					const start = starts[i];
					const end = ends[i];
					originalTool.drawSegmentOfPath(
						ctx,
						start.x,
						start.y,
						end.x,
						end.y,
						swatch
					);
				}
			};
		}
		if (originalTool.drawShape) {
			const newTool = (tools[newKey] = {});
			newTool.drawShape = (ctx, x1, y1, x2, y2, swatch) => {
				const starts = modifier.pointToPoints(x1, y1, ctx);
				const ends = modifier.pointToPoints(x2, y2, ctx);
				for (let i = 0; i < starts.length; i++) {
					const start = starts[i];
					const end = ends[i];
					originalTool.drawShape(ctx, start.x, start.y, end.x, end.y, swatch);
				}
			};
		}
		// if (originalTool.click) {
		// 	const newTool = (tools[newKey] = {});
		// 	newTool.click = (ctx, x, y, swatch, documentCtx) => {
		// 		const starts = modifier.pointToPoints(x, y, ctx);
		// 		// console.log(starts);
		// 		for(let i = 0; i < starts.length; i++){
		// 			// break;
		// 			const start = starts[i];
		// 			originalTool.click(
		// 				ctx,
		// 				start.x,
		// 				start.y,
		// 				swatch,
		// 				documentCtx
		// 			);
		// 		}
		// 	};
		// }
	});
});

const toolsArray = Object.keys(tools).map((key) => {
	const tool = tools[key];
	return { name: key, ...tool };
});

export default toolsArray;
