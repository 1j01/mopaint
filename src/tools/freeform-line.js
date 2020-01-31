const line = (ctx, x1, y1, x2, y2, swatch) => {
	// TODO: circle if coords are the same (i.e. no length to the line)?
	// (could approximate by shifting a coordinate minisculely)
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.strokeStyle = swatch;
	ctx.lineWidth = 5;
	ctx.lineCap = "round";
	ctx.stroke();
};

export default line;

export const tool = {
	name: "Freeform Line",
	// TODO: smooth (rather than just plain segments)
	drawSegmentOfPath: line,
};
