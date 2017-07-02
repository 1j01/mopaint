
const line = (ctx, x1, y1, x2, y2, swatch)=> {
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.strokeStyle = swatch;
	ctx.lineWidth = 5;
	ctx.lineCap = "round";
	ctx.stroke();
};

export default line;
