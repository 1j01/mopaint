
export default {
	name: "Brush",
	// TODO: smooth (rather than just plain segments)
	// TODO: circle if coords are the same (i.e. no length to the line)?
	// (could approximate by shifting a coordinate minisculely)
	drawFromGesturePoints: (opContext, points, swatch)=> {
		opContext.beginPath();
		const bristles = [];
		const numberOfBristles = 20;
		for (let b = 0; b < numberOfBristles; b++) {
			bristles.push({
				x: points[0].x + Math.sin(b / numberOfBristles * Math.PI * 2) * 5,
				y: points[0].y + Math.cos(b / numberOfBristles * Math.PI * 2) * 5,
				vx: 0,
				vy: 0,
			});
		}
		for (let b = 0; b < numberOfBristles; b++) {
			const bristle = bristles[b];
			opContext.moveTo(bristle.x, bristle.y);
			for (let i = 1; i < points.length; i += 1) {
				const dist = Math.hypot(points[i].x - points[i-1].x, points[i].y - points[i-1].y);
				const spread = Math.min(Math.max(dist/5, 5), 15);
				const targetX = points[i].x + Math.sin(b / numberOfBristles * Math.PI * 2) * spread;
				const targetY = points[i].y + Math.sin(b / numberOfBristles * Math.PI * 2) * spread;
				bristle.vx += (targetX - bristle.x) * 0.3;
				bristle.vy += (targetY - bristle.y) * 0.3;
				bristle.vx *= 0.4;
				bristle.vy *= 0.4;
				bristle.x += bristle.vx;
				bristle.y += bristle.vy;
				opContext.lineTo(bristle.x, bristle.y);
			}
		}
		opContext.strokeStyle = swatch;
		opContext.lineWidth = 5;
		opContext.lineCap = "round";
		opContext.lineJoin = "round";
		opContext.stroke();
	},
};
