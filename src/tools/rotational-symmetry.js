// TODO: user-configurable center and number of repetitions and everything

const rotationallyReflect = (ctx, x1, y1, x2, y2, swatch, tool) => {
	const offsetAngle = 0; // Radians
	const repetitions = 6;
	const centerX = ctx.canvas.width / 2;
	const centerY = ctx.canvas.height / 2;

	// Returns an array of {x, y} objects representing the symmetries of the given coordinates.
	// Based on https://www.nayuki.io/page/symmetry-sketcher-javascript
	const getSymmetryPoints = (x, y) => {
		// up = 0 degrees, right = 90 deg, down = 180 deg, left = 270 deg
		const relativeX = x - centerX;
		const relativeY = centerY - y;
		const distance = Math.hypot(relativeX, relativeY);
		const angle = Math.atan2(relativeX, relativeY) + offsetAngle; // Radians
		const result = [];
		for (let i = 0; i < repetitions; i++) {
			let theta = angle + Math.PI * 2 / repetitions * i; // Radians
			x = centerX + Math.sin(theta) * distance;
			y = centerY - Math.cos(theta) * distance;
			result.push({ x, y });
			// if (mirrorSymmetry) {
			// 	x = centerX - Math.sin(theta) * distance;
			// 	result.push([x, y]);
			// }
		}
		return result;
	};

	const reflectedStartPoints = getSymmetryPoints(x1, y1);
	const reflectedEndPoints = getSymmetryPoints(x2, y2);
	for (let i = 0; i < repetitions; i++) {
		let startPoint = reflectedStartPoints[i];
		let endPoint = reflectedEndPoints[i];
		tool(ctx, startPoint.x, startPoint.y, endPoint.x, endPoint.y, swatch);
	}
};

export default rotationallyReflect;
