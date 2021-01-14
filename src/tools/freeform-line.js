
export default {
	name: "Freeform Line",
	// TODO: smooth (rather than just plain segments)
	// TODO: circle if coords are the same (i.e. no length to the line)?
	// (could approximate by shifting a coordinate minisculely)
	drawFromPoints: (opContext, points, swatch) => {
		opContext.beginPath();
		opContext.moveTo(points[0].x, points[0].y);
		for (let i = 1; i < points.length; i += 1) {
			opContext.lineTo(points[i].x, points[i].y);
		}
		opContext.strokeStyle = swatch;
		opContext.lineWidth = 5;
		opContext.lineCap = "round";
		opContext.lineJoin = "round";
		opContext.stroke();
	},
};
