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
		icon: "flaticons-fill-bucket-flipped.svg",
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
// TODO: show preview of the multiple points the user will interact with when they do
const pointModifiers = [
	{
		prefix: "Mirror Symmetric ",
		// name: "Mirror Symmetry",
		// name: "Mirror Reflect",
		// icon: "noun-symmetry.svg",
		pointToPoints: mirrorReflect,
	},
	{
		prefix: "Rotationally Symmetric ",
		// name: "Rotational Symmetry",
		// name: "Point Reflect",
		// icon: "noun-celtic-knot.svg",
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
		// TODO: sub-operations for symmetric fill so that it can use the underlying image data of the canvas
		// consistently when called multiple times in an operation
		// (It could also work by accepting multiple starting points simply enough in the fill algorithm,
		// but it's a matter of complicating the external code (and the boundary/API),
		// and I think generally we want it to act as if there were simply multiple clicks,
		// so more tools can work without change, so it would be good to do that earlier on.
		// Other tools like the line tool could benefit from taking the geometry of multiple lines to draw all at once as an optimization,
		// so maybe it could be an opt in thing, but also maybe that could be optimized at a different level like the browser,
		// maybe they have optimizations for that, or maybe it's not worth worrying about; there'll be much more complex tools,
		// and we'll want WegGL at some point and it's not worth thinking about atm. --io May 28)
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
