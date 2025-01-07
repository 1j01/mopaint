import { generateID } from "../../helpers.js";
import { Client, MopaintWebSocketClient } from "../networking.js";

const client = new Client();
new MopaintWebSocketClient(client, `${location.protocol.match(/s:$/) ? "wss://" : "ws://"}${location.host}`);

const root = document.getElementById("root");

const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
svg.setAttribute("width", "100%");
svg.setAttribute("height", "100%");
svg.style.touchAction = "none";
root.appendChild(svg);

let tempPoint = svg.createSVGPoint();

/** Get the cursor position in SVG coordinates */
function getCursorPoint(event: MouseEvent): SVGPoint {
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

// Instead of adding a listener for each brush stroke to handle new points coming in,
// we can use a map of operation IDs to update handlers.
// This should be a little more efficient as the history gets long, being O(1) instead of O(n),
// for the lookup, although the map is still growing indefinitely.
// Who can say when a brush stroke has truly ended? (TODO: us, we can say)
const updateHandlers = new Map();
const operationHandlers = {
	circle: (operation) => {
		const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		circle.setAttribute("cx", operation.x);
		circle.setAttribute("cy", operation.y);
		circle.setAttribute("r", "10");
		circle.setAttribute("fill", operation.color);
		svg.appendChild(circle);
	},
	brush: (operation) => {
		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute("stroke", operation.color);
		path.setAttribute("fill", "none");
		path.setAttribute("d", `M ${operation.points.map((point) => `${point.x} ${point.y}`).join(" L ")}`);
		svg.appendChild(path);
		updateHandlers.set(operation.operationId, (updatedOperation) => {
			path.setAttribute("d", `M ${updatedOperation.points.map((point) => `${point.x} ${point.y}`).join(" L ")}`);
		});
	},
};

client.onAnyOperation((operation) => {
	if (operationHandlers[operation.type]) {
		operationHandlers[operation.type](operation);
	} else {
		console.warn(`Unknown operation type: ${operation.type}`);
	}
});

client.onAnyOperationUpdated((operation, data) => {
	if (updateHandlers.has(operation.operationId)) {
		updateHandlers.get(operation.operationId)(operation, data);
	}
});

