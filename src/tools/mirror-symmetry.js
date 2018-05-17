const mirrorReflect = (ctx, x1, y1, x2, y2, swatch, tool) => {
	tool(ctx, x1, y1, x2, y2, swatch);

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

	const reflected_1 = reflectPoint(x1, y1);
	const reflected_2 = reflectPoint(x2, y2);

	tool(ctx, reflected_1.x, reflected_1.y, reflected_2.x, reflected_2.y, swatch);
};

export default mirrorReflect;
