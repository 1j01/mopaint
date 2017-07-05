
const copyCanvas = (canvas)=> {
	const newCanvas = document.createElement("canvas");
	newCanvas.width = canvas.width;
	newCanvas.height = canvas.width;
	const newCtx = newCanvas.getContext("2d");
	newCtx.drawImage(canvas, 0, 0);
	return newCanvas;
};

// TODO: handle resizing the image as part of an action

export default class ImageAction {
	constructor(patchContext, x, y) {
		const {width, height} = patchContext.canvas;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.reversePatchImageData = null;
		this.patchCanvas = copyCanvas(patchContext.canvas);
		// TODO: probably copyCanvas(patchContext.canvas, x, y, width, height);
	}
	apply(documentContext) {
		const {x, y, width, height} = this;
		this.reversePatchImageData = documentContext.getImageData(x, y, width, height);
		documentContext.drawImage(this.patchCanvas, this.x, this.y);
	}
	applyReverse(documentContext) {
		documentContext.putImageData(this.reversePatchImageData, this.x, this.y);
	}
}
