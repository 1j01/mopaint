// TODO:
// * Keep bounds and return them
// (like this implementation does: https://github.com/hughsk/flood-fill)
// so an image operation can at least be bounded by the affected region
// (which could save memory, or save the time that a general bounding box finding algorithm would take),
// if not have the fill separated out (which could save memory further if the image operation is compressed, e.g. as a PNG)
// * Separate the fill (output) from the reference (input)?
// so the image operation contains only the fill (and maybe anti-aliasing against shapes).
// * Split out "flood" function for more arbitrary selective operations
// e.g. selective selection, AKA the "magic wand" tool.
// * Optimize flood based on chunks / make it handle chunks in order to do infinite documents etc.
// Need to keep track of visited chunks, but could revisit a chunk from a different side.
// Imagine the worst case of a flood fill algorithm input, but spread across chunks.
// * Show progress bar and cancel button as necessary
// (This would be handled outside any flooding and/or filling implementation(s).)
// * Support fill with bitmap (pattern as swatch).
// * Tolerance threshold, and maybe some fancier blending (i.e. non-binary)...
// * Also, I want to support workflows where you draw fills underneath other shapes/strokes,
// and have the fills extend by at least the antialiasing distance.
// (This is good for comics, from what I've seen.)

// Other optimizations may include:
// * Delegate to Web Workers or the GPU.
// GPU.js looks interesting: https://github.com/gpujs/gpu.js
// * Compile JavaScript to Web Assembly with a tool for that
// * Get and set entire pixels at a time instead of individual RGBA components
// https://hacks.mozilla.org/2011/12/faster-canvas-pixel-manipulation-with-typed-arrays/
// * Study and implement ideas from an optimized flood fill algorithm,
// or port one, either by hand or with Emscripten
// QuickFill: https://www.codeproject.com/Articles/6017/QuickFill-An-efficient-flood-fill-algorithm
// Queue-Linear: https://www.codeproject.com/Articles/16405/Queue-Linear-Flood-Fill-A-Fast-Flood-Fill-Algorith

const fill = (ctx, x, y, swatch) => {
	const canvas = ctx.canvas;

	x = Math.floor(x);
	y = Math.floor(y);

	const stack = [[x, y]];
	const image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
	let pixel_index = (y * canvas.width + x) * 4;
	const start_r = image_data.data[pixel_index + 0];
	const start_g = image_data.data[pixel_index + 1];
	const start_b = image_data.data[pixel_index + 2];
	const start_a = image_data.data[pixel_index + 3];

	const one_pixel_canvas = document.createElement("canvas");
	const one_pixel_canvas_ctx = one_pixel_canvas.getContext("2d");
	one_pixel_canvas_ctx.fillStyle = swatch;
	one_pixel_canvas_ctx.fillRect(0, 0, 1, 1);
	const one_pixel_image_data = one_pixel_canvas_ctx.getImageData(0, 0, 1, 1);
	const [fill_r, fill_g, fill_b, fill_a] = one_pixel_image_data.data;

	// console.log([start_r, start_g, start_b, start_a], [fill_r, fill_g, fill_b, fill_a]);

	if (
		fill_r === start_r &&
		fill_g === start_g &&
		fill_b === start_b &&
		fill_a === start_a
	) {
		return;
	}

	while (stack.length) {
		let new_pos, x, y, pixel_index, reach_left, reach_right;
		new_pos = stack.pop();
		x = new_pos[0];
		y = new_pos[1];

		pixel_index = (y * canvas.width + x) * 4;
		while (matches_start_color(pixel_index)) {
			y--;
			pixel_index = (y * canvas.width + x) * 4;
		}
		reach_left = false;
		reach_right = false;
		while (true) {
			y++;
			pixel_index = (y * canvas.width + x) * 4;

			if (!(y < canvas.height && matches_start_color(pixel_index))) {
				break;
			}

			color_pixel(pixel_index);

			if (x > 0) {
				if (matches_start_color(pixel_index - 4)) {
					if (!reach_left) {
						stack.push([x - 1, y]);
						reach_left = true;
					}
				} else if (reach_left) {
					reach_left = false;
				}
			}

			if (x < canvas.width - 1) {
				if (matches_start_color(pixel_index + 4)) {
					if (!reach_right) {
						stack.push([x + 1, y]);
						reach_right = true;
					}
				} else if (reach_right) {
					reach_right = false;
				}
			}

			pixel_index += canvas.width * 4;
		}
	}
	ctx.putImageData(image_data, 0, 0);

	function matches_start_color(pixel_index) {
		return (
			image_data.data[pixel_index + 0] === start_r &&
			image_data.data[pixel_index + 1] === start_g &&
			image_data.data[pixel_index + 2] === start_b &&
			image_data.data[pixel_index + 3] === start_a
		);
	}

	function color_pixel(pixel_index) {
		image_data.data[pixel_index + 0] = fill_r;
		image_data.data[pixel_index + 1] = fill_g;
		image_data.data[pixel_index + 2] = fill_b;
		image_data.data[pixel_index + 3] = fill_a;
	}
};

export default fill;
