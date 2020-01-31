import line from "./line.js";
import circle from "./circle.js";
import rectangle from "./rectangle.js";
import fill from "./fill.js";
import mirrorReflect from "./mirror-symmetry.js";
import rotationallyReflect from "./rotational-symmetry.js";
// // import { ReactComponent as SymmetryIcon } from "../icons/noun-symmetry.svg";
// // import { ReactComponent as CelticKnotIcon } from "../icons/noun-celtic-knot.svg";
import { ReactComponent as FillBucketIcon } from "../icons/flaticons-fill-bucket-flipped.svg";


const tools = {
	"Freeform Line": {
		drawSegmentOfPath: line,
	},
	"Line": {
		drawShape: line,
	},
	"Freeform Circles": {
		drawSegmentOfPath: circle,
	},
	"Circle": {
		drawShape: circle,
	},
	"Rectangle": {
		drawShape: rectangle,
	},
	"Fill": {
		Icon: FillBucketIcon,
		// these UI function signatures are pretty arbitrary and would only get worse
		// as time goes on and I maintain backwards compatibility (even out of laziness!) and add things to the end
		// and it doesn't help that there's this layer of indirection where I have to map these signatures
		click: function(opCtx, x, y, swatch, documentCtx) {
			opCtx.drawImage(documentCtx.canvas, 0, 0);
			fill(opCtx, x, y, swatch);
		},
	},
};

// TODO: allow the USER to compose tools (dynamically)
// TODO: show preview of multiple points the user will interact with if they interact
const pointModifiers = [
	{
		prefix: "Mirror Symmetric ",
		// name: "Mirror Symmetry",
		// name: "Mirror Reflect",
		// icon: SymmetryIcon,
		pointToPoints: mirrorReflect,
	},
	{
		prefix: "Rotationally Symmetric ",
		// name: "Rotational Symmetry",
		// name: "Point Reflect",
		// icon: CelticKnotIcon,
		pointToPoints: rotationallyReflect,
	},
];
// TODO: for now I'm relying on a sort of set of separate APIs for tools based on certain kinds of geometry they can take
// something better might involve streams of events / geometry, or just generally be more general

pointModifiers.forEach((modifier) => {
	Object.keys(tools).forEach((key) => {
		const originalTool = tools[key];
		const newKey = modifier.prefix + key;

		// if (originalTool.drawSegmentOfPath || originalTool.drawShape || originalTool.click) {
		// TODO: DRY and rework all this, make all this unnecessary and obsolete
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
		// (The fill tool could also work by accepting multiple starting points (easily),
		// but it's a matter of complicating the external code (and the boundary/API),
		// and I think generally we want it to act as if there were simply multiple separate clicks/gestures,
		// so more tools can work without change, so it would be good to do that earlier on.
		// Other tools like the line tool could benefit from taking the geometry of multiple lines to draw all at once as an optimization,
		// so maybe there could be a way for tools to opt in to handling batching for optimization)
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

Object.keys(tools).forEach((key) => {
	const tool = tools[key];

	// if (tool.drawSegmentOfPath || tool.drawShape || tool.click) {
	if (tool.drawSegmentOfPath) {
		// TODO: do smoothing (rather than just plain segments) for brush tool(s)
		tool.drawFromGesturePoints = (opContext, points, swatch)=> {
			for (let i1 = 0, i2 = 1; i2 < points.length; i1 += 1, i2 += 1) {
				tool.drawSegmentOfPath(
					opContext,
					points[i1].x,
					points[i1].y,
					points[i2].x,
					points[i2].y,
					swatch
				);
			}
		};
	}
	if (tool.drawShape) {
		tool.drawFromGesturePoints = (opContext, points, swatch)=> {
			const startPos = points[0];
			const lastPos = points[points.length - 1];
			tool.drawShape(
				opContext,
				startPos.x,
				startPos.y,
				lastPos.x,
				lastPos.y,
				swatch
			);
		};
	}
	if (tool.click) {
		tool.drawFromGesturePoints = (opContext, points, swatch, documentContext)=> {
			const startPos = points[0];
			tool.click(opContext, startPos.x, startPos.y, swatch, documentContext);
		};
	}
});
const toolsArray = Object.keys(tools).map((key) => {
	const tool = tools[key];
	tool.name = key;
	return tool;
});

export default toolsArray;
export const toolsByName = tools;
