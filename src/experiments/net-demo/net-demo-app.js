import { Client, MopaintWebSocketClient } from "../networking.js";

const client = new Client();
new MopaintWebSocketClient(client, `ws://localhost:${import.meta.env.PORT || 8080}`);

const root = document.getElementById("root");

const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("width", "100%");
svg.setAttribute("height", "100%");
root.appendChild(svg);

let tempPoint = svg.createSVGPoint();

/**
 * @param {MouseEvent} event
 * @returns {SVGPoint} point in SVG coordinates
 */
function getCursorPoint(event) {
	tempPoint.x = event.clientX;
	tempPoint.y = event.clientY;
	return tempPoint.matrixTransform(svg.getScreenCTM().inverse());
}

svg.addEventListener("pointerdown", (event) => {
	const point = getCursorPoint(event);
	client.addOperation({
		type: "pointerdown",
		x: point.x,
		y: point.y,
		color: `hsl(${Math.random() * 360}, 100%, 50%)`,
	});
});

client.onAnyOperation((operation) => {
	if (operation.type === "pointerdown") {
		const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		circle.setAttribute("cx", operation.x);
		circle.setAttribute("cy", operation.y);
		circle.setAttribute("r", 10);
		circle.setAttribute("fill", operation.color);
		svg.appendChild(circle);
	}
});

