const getMirrorSymmetryPoints = (x, y, flipCenterX, flipCenterY) => {
	// const angle = 0;
	// TODO: let user choose symmetry line

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
