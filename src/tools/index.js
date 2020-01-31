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
Object.keys(tools).forEach((key) => {
	const tool = tools[key];

	if (tool.drawSegmentOfPath) {
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

pointModifiers.forEach((modifier) => {
	Object.keys(tools).forEach((key) => {
		const originalTool = tools[key];
		const newKey = modifier.prefix + key;

		if (originalTool.click) {
			return; // skip Fill tool for now
			// TODO: either pass multiple starting points to the Fill tool at once,
			// or set it up so the document is updated between multiple calls to the Fill tool
			// (could do some sort of "sub-operations" thing for the latter, or something simpler)
			// (OR set it up to isolate the fill region on the opCanvas and then combine the fill regions from multiple calls,
			// but that would be inefficient, processing areas multiple times)
			// Other tools like the line tool could benefit from taking the geometry of multiple lines to draw all at once as an optimization,
			// so maybe there could be a way for tools to opt in to handling batching for optimization?
		}
		if (originalTool.drawFromGesturePoints) {
			const newTool = (tools[newKey] = {});
			newTool.drawFromGesturePoints = (opContext, gesturePoints, swatch, documentContext) => {
				const pointses = []; // very silly name
				for (const gesturePoint of gesturePoints) {
					const symmetricPoints = modifier.pointToPoints(gesturePoint.x, gesturePoint.y, opContext);
					for (let i = 0; i < symmetricPoints.length; i++) {
						pointses[i] = pointses[i] || [];
						pointses[i].push(symmetricPoints[i]);
					}
				}
				for (const points of pointses) {
					originalTool.drawFromGesturePoints(opContext, points, swatch, documentContext);
				}
			};
		}
	});
});

const toolsArray = Object.keys(tools).map((key) => {
	const tool = tools[key];
	tool.name = key;
	return tool;
});

export default toolsArray;
export const toolsByName = tools;
