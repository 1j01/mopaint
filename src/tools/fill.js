// TODO:
// * Keep bounds and return them
// (like this implementation does: https://github.com/hughsk/flood-fill)
// so cached fill region data can be bounded by the affected region
// (which could save memory, or save the time that a general bounding box finding algorithm would take - like trim-canvas.js),
// * Separate the flood fill region (output) from the reference (input),
// so the flood fill can be used to implement more types of operations,
// like the "Magic Wand" tool, and custom things like "Fill with Offset"
// (by adding a Move in between Flood Fill and Draw Fill Region, or whatever)
// * Optimize flood based on chunks / make it handle chunks in order to do infinite documents etc.
// Need to keep track of visited chunks, but could revisit a chunk from a different side.
// Imagine the worst case of a flood fill algorithm input, but spread across chunks.
// * Show progress bar and cancel button as necessary
// (UI would be handled outside any flooding/filling implementations.)
// * Support fill with bitmap (pattern as swatch).
// * Tolerance threshold, and maybe some fancier blending (i.e. non-binary)...
// * Also, I want to support workflows where you draw fills underneath other shapes/strokes,
// and have the fills extend by at least the antialiasing distance.
// (This is good for comics, from what I've seen.)

// Other optimizations may include:
// * Delegate to Web Workers or the GPU.
// GPU.js looks interesting: https://github.com/gpujs/gpu.js
// * Compile JavaScript to Web Assembly with a tool
// * Get and set entire pixels at a time instead of individual RGBA components
// https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
// * Study and implement ideas from an optimized flood fill algorithm,
// or port one, either by hand or with Emscripten
// QuickFill: https://www.codeproject.com/Articles/6017/QuickFill-An-efficient-flood-fill-algorithm
// Queue-Linear: https://www.codeproject.com/Articles/16405/Queue-Linear-Flood-Fill-A-Fast-Flood-Fill-Algorith

export default function fill(ctx, x, y, swatch) {
	const canvas = ctx.canvas;

	x = Math.floor(x);
	y = Math.floor(y);

	if (x < 0 || y < 0 || x > canvas.width || y > canvas.height) {
		return;
	}

	const stack = [[x, y]];
	const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	let pixelIndex = (y * canvas.width + x) * 4;
	const startR = imageData.data[pixelIndex + 0];
	const startG = imageData.data[pixelIndex + 1];
	const startB = imageData.data[pixelIndex + 2];
	const startA = imageData.data[pixelIndex + 3];

	const onePixelCanvas = document.createElement("canvas");
	const onePixelCanvasCtx = onePixelCanvas.getContext("2d");
	onePixelCanvasCtx.fillStyle = swatch;
	onePixelCanvasCtx.fillRect(0, 0, 1, 1);
	const onePixelImageData = onePixelCanvasCtx.getImageData(0, 0, 1, 1);
	const [fillR, fillG, fillB, fillA] = onePixelImageData.data;

	// console.log([startR, startG, startB, startA], [fillR, fillG, fillB, fillA]);

	if (
		fillR === startR &&
		fillG === startG &&
		fillB === startB &&
		fillA === startA
	) {
		return;
	}

	while (stack.length) {
		let newPos, x, y, pixelIndex, reachLeft, reachRight;
		newPos = stack.pop();
		x = newPos[0];
		y = newPos[1];

		pixelIndex = (y * canvas.width + x) * 4;
		while (matchesStartColor(pixelIndex)) {
			y--;
			pixelIndex = (y * canvas.width + x) * 4;
		}
		reachLeft = false;
		reachRight = false;
		// eslint-disable-next-line no-constant-condition
		while (true) {
			y++;
			pixelIndex = (y * canvas.width + x) * 4;

			if (!(y < canvas.height && matchesStartColor(pixelIndex))) {
				break;
			}

			colorPixel(pixelIndex);

			if (x > 0) {
				if (matchesStartColor(pixelIndex - 4)) {
					if (!reachLeft) {
						stack.push([x - 1, y]);
						reachLeft = true;
					}
				} else if (reachLeft) {
					reachLeft = false;
				}
			}

			if (x < canvas.width - 1) {
				if (matchesStartColor(pixelIndex + 4)) {
					if (!reachRight) {
						stack.push([x + 1, y]);
						reachRight = true;
					}
				} else if (reachRight) {
					reachRight = false;
				}
			}

			pixelIndex += canvas.width * 4;
		}
	}
	ctx.putImageData(imageData, 0, 0);

	function matchesStartColor(pixelIndex) {
		return (
			imageData.data[pixelIndex + 0] === startR &&
			imageData.data[pixelIndex + 1] === startG &&
			imageData.data[pixelIndex + 2] === startB &&
			imageData.data[pixelIndex + 3] === startA
		);
	}

	function colorPixel(pixelIndex) {
		imageData.data[pixelIndex + 0] = fillR;
		imageData.data[pixelIndex + 1] = fillG;
		imageData.data[pixelIndex + 2] = fillB;
		imageData.data[pixelIndex + 3] = fillA;
	}
}
