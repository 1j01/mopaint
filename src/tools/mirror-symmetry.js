const getMirrorSymmetryPoints = (x, y, ctx) => {
	// const angle = 0;
	const flipCenterX = ctx.canvas.width / 2;
	// const flipCenterY = ctx.canvas.height / 2;
	// TODO: user-configurable axis

	const reflectPoint = (x, y) => ({
		// TODO: work with arbitrary angle
		// x: flipCenterX + Math.cos(angle) * (x - flipCenterX) + Math.sin(angle) * (y - flipCenterY),
		// y: flipCenterY + Math.sin(angle) * (x - flipCenterX) + Math.cos(angle) * (y - flipCenterY),
		x: flipCenterX * 2 - x,
		y: y,
	});

	return [{ x, y }, reflectPoint(x, y)];
};

export default getMirrorSymmetryPoints;
