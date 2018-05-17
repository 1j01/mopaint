const circle = (ctx, x1, y1, x2, y2, swatch) => {
	const radius = Math.hypot(x2 - x1, y2 - y1);
	ctx.beginPath();
	ctx.arc(x1, y1, radius, 0, Math.PI * 2);
	ctx.fillStyle = swatch;
	ctx.fill();
};

export default circle;
