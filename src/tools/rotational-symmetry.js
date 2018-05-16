
const offsetAngle = 0; // Radians
const repetitions = 6;
const centerX = 640 / 2;
const centerY = 480 / 2;
// TODO: user-configurable center and number of repetitions and everything

// Returns an array of {x, y} objects representing the symmetries of the given coordinates,
// based on the (currently global) symmetry settings.
// Based on https://www.nayuki.io/page/symmetry-sketcher-javascript
function getSymmetryPoints(x, y) {
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
		result.push({x, y});
		// if (mirrorSymmetry) {
		// 	x = centerX - Math.sin(theta) * distance;
		// 	result.push([x, y]);
		// }
	}
	return result;
}

const rotationallyReflect = (ctx, x1, y1, x2, y2, swatch, tool)=> {
	// for (let i = 0; i < repetitions; i++) {
	// 	const angle = offsetAngle + Math.PI * 2 * i / repetitions;

	// 	const reflectedPoint1 = reflectPoint(x1, y1, angle);
	// 	const reflectedPoint2 = reflectPoint(x2, y2, angle);

	// 	tool(ctx, reflectedPoint1.x, reflectedPoint1.y, reflectedPoint2.x, reflectedPoint2.y, swatch);
	// }

	const reflectedStartPoints = getSymmetryPoints(x1, y1);
	const reflectedEndPoints = getSymmetryPoints(x2, y2);
	for (let i = 0; i < repetitions; i++) {
		let startPoint = reflectedStartPoints[i];
		let endPoint = reflectedEndPoints[i];
		tool(ctx, startPoint.x, startPoint.y, endPoint.x, endPoint.y, swatch);
	}
};

export default rotationallyReflect;
