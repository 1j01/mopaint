/*
const copyCanvas = (canvas) => {
	const newCanvas = document.createElement("canvas");
	newCanvas.width = canvas.width;
	newCanvas.height = canvas.width;
	const newCtx = newCanvas.getContext("2d");
	newCtx.drawImage(canvas, 0, 0);
	return newCanvas;
};

// dec2hex :: Integer -> String
function dec2hex(dec) {
	return ("0" + dec.toString(16)).substr(-2);
}

// generateId :: Integer -> String
function generateId(len) {
	var arr = new Uint8Array((len || 40) / 2);
	window.crypto.getRandomValues(arr);
	return Array.from(arr, dec2hex).join("");
}

// TODO: handle resizing the image as part of an action

export default class ImageAction {
	constructor(patchContext, x, y, tool, name) {
		this.tool = tool;
		this.name = name;
		this.x = x;
		this.y = y;
		const { width, height } = patchContext.canvas;
		this.width = width;
		this.height = height;
		this.reversePatchImageData = null;
		this.patchCanvas = copyCanvas(patchContext.canvas);
		// TODO: probably copyCanvas(patchContext.canvas, x, y, width, height);
		this.id = generateId(10);
	}
	apply(documentContext) {
		const { x, y, width, height } = this;
		this.reversePatchImageData = documentContext.getImageData(
			x,
			y,
			width,
			height
		);
		documentContext.drawImage(this.patchCanvas, this.x, this.y);
	}
	applyReverse(documentContext) {
		documentContext.putImageData(this.reversePatchImageData, this.x, this.y);
	}
}
*/
