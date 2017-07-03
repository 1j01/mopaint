const rectangle = (ctx, x1, y1, x2, y2, swatch)=> {
	ctx.beginPath();
	ctx.rect(x1, y1, x2 - x1, y2 - y1);
	ctx.fillStyle = swatch;
	ctx.fill();
};

export default rectangle;
