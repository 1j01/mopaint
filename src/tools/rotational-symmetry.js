// TODO: let user choose center and number of repetitions and everything

// Returns an array of {x, y} objects representing the symmetries of the given coordinates.
// Based on https://www.nayuki.io/page/symmetry-sketcher-javascript
const getRotationalSymmetryPoints = (x, y, centerX, centerY) => {
	const offsetAngle = 0; // Radians
	const repetitions = 6;

	// up = 0 degrees, right = 90 deg, down = 180 deg, left = 270 deg
	const relativeX = x - centerX;
	const relativeY = centerY - y;
	const distance = Math.hypot(relativeX, relativeY);
	const angle = Math.atan2(relativeX, relativeY) + offsetAngle; // Radians
	const result = [];
	for (let i = 0; i < repetitions; i++) {
		let theta = angle + ((Math.PI * 2) / repetitions) * i; // Radians
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

export default getRotationalSymmetryPoints;
