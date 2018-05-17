const line = (ctx, x1, y1, x2, y2, swatch) => {
	// TODO: circle if coords are the same?
	// (could approximate by shifting a coord minisculely)
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.strokeStyle = swatch;
	ctx.lineWidth = 5;
	ctx.lineCap = "round";
	ctx.stroke();
};

export default line;
