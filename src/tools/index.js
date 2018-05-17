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
const modifiers = [
	{
		prefix: "Mirror Symmetric ",
		metaTool: mirrorReflect,
	},
	{
		prefix: "Rotationally Symmetric ",
		metaTool: rotationallyReflect,
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

Object.keys(tools).forEach((key) => {
	const originalTool = tools[key];
	if (originalTool.drawSegmentOfPath) {
		modifiers.forEach((modifier) => {
			const newKey = modifier.prefix + key;
			tools[newKey] = {
				drawSegmentOfPath: (ctx, x1, y1, x2, y2, swatch) => {
					modifier.metaTool(
						ctx,
						x1,
						y1,
						x2,
						y2,
						swatch,
						originalTool.drawSegmentOfPath
					);
				},
			};
		});
	}
});

const toolsArray = Object.keys(tools).map((key) => {
	const tool = tools[key];
	return { name: key, ...tool };
});

export default toolsArray;
