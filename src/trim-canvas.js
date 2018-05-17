// Based on https://gist.github.com/timdown/021d9c8f2aabc7092df564996f5afbbf

const trimCanvas = (function() {
	function rowBlank(imageData, width, y) {
		for (let x = 0; x < width; ++x) {
			if (imageData.data[y * width * 4 + x * 4 + 3] !== 0) return false;
		}
		return true;
	}

	function columnBlank(imageData, width, x, top, bottom) {
		for (let y = top; y < bottom; ++y) {
			if (imageData.data[y * width * 4 + x * 4 + 3] !== 0) return false;
		}
		return true;
	}

	return function(canvas) {
		const ctx = canvas.getContext("2d");
		const width = canvas.width;
		const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		let top = 0,
			bottom = imageData.height,
			left = 0,
			right = imageData.width;

		while (top < bottom && rowBlank(imageData, width, top)) ++top;
		while (bottom - 1 > top && rowBlank(imageData, width, bottom - 1)) --bottom;
		while (left < right && columnBlank(imageData, width, left, top, bottom))
			++left;
		while (
			right - 1 > left &&
			columnBlank(imageData, width, right - 1, top, bottom)
		)
			--right;

		const trimmed = ctx.getImageData(
			left,
			top,
			right - left || 1,
			bottom - top || 1
		);
		const copy = canvas.ownerDocument.createElement("canvas");
		const copyCtx = copy.getContext("2d");
		copy.width = trimmed.width;
		copy.height = trimmed.height;
		copyCtx.putImageData(trimmed, 0, 0);

		return copy;
	};
})();

export default trimCanvas;
