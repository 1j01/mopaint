import { generateID } from "../../helpers.js";
import { Client, MopaintWebSocketClient } from "../networking.js";

const client = new Client();
new MopaintWebSocketClient(client, `${location.protocol.match(/s:$/) ? "wss://" : "ws://"}${location.host}`);

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

let activeOperation = null;
svg.addEventListener("pointerdown", (event) => {
	const point = getCursorPoint(event);
	activeOperation = {
		operationId: generateID(),
		type: "brush",
		points: [{ x: point.x, y: point.y }],
		color: `hsl(${Math.random() * 360}, 100%, 50%)`,
	};
	client.addOperation(activeOperation);

	const pointerMoveListener = (event) => {
		const point = getCursorPoint(event);
		client.pushContinuousOperationData(activeOperation.operationId, {
			points: { x: point.x, y: point.y },
		});
	};
	const pointerUpListener = () => {
		document.removeEventListener("pointermove", pointerMoveListener);
		document.removeEventListener("pointerup", pointerUpListener);
		activeOperation = null;
	};
	document.addEventListener("pointermove", pointerMoveListener);
	document.addEventListener("pointerup", pointerUpListener);
});

client.onAnyOperation((operation) => {
	if (operation.type === "circle") {
		const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		circle.setAttribute("cx", operation.x);
		circle.setAttribute("cy", operation.y);
		circle.setAttribute("r", 10);
		circle.setAttribute("fill", operation.color);
		svg.appendChild(circle);
	} else if (operation.type === "brush") {
		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute("stroke", operation.color);
		path.setAttribute("fill", "none");
		path.setAttribute("d", `M ${operation.points.map((point) => `${point.x} ${point.y}`).join(" L ")}`);
		svg.appendChild(path);
		// HACK: TODO: don't add so many listeners indefinitely
		client.onAnyOperationUpdated((updatedOperation, data) => {
			if (updatedOperation.operationId === operation.operationId) {
				// operation.points.push(data.points); // already done by the Client class, I think
				path.setAttribute("d", `M ${operation.points.map((point) => `${point.x} ${point.y}`).join(" L ")}`);
			}
		});
	}
});

