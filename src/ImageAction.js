
// TODO: undo/redo using something like this
// NOTE: would need to handle resizing the canvas at some point

export default class ImageAction {
	constructor(sourceCanvas, patchCanvas, x, y) {
		const {width, height} = patchCanvas;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.reversePatchImageData = sourceCanvas.getImageData(x, y, width, height);
		this.patchImageData = patchCanvas.getImageData(0, 0, width, height);
	}
	apply(ctx) {
		ctx.putImageData(this.x, this.y, this.patchImageData);
	}
	unapply(ctx) {
		ctx.putImageData(this.x, this.y, this.reversePatchImageData);
	}
}
