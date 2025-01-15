import { generateID } from "../../helpers.ts";
import { BrushOpData, CircleOpData, ContinuousOperationUpdate, HistoryStore, MopaintWebSocketClient, Operation } from "../networking.js";

const store = new HistoryStore();
new MopaintWebSocketClient(store, `${location.protocol.match(/s:$/) ? "wss://" : "ws://"}${location.host}`);

const root = document.getElementById("root")!;

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
	return tempPoint.matrixTransform(svg.getScreenCTM()!.inverse());
}

svg.addEventListener("pointerdown", (event) => {
	const point = getCursorPoint(event);
	const activeOperation = store.addOperation({
		operationId: generateID(),
		data: {
			type: "brush",
			points: [{ x: point.x, y: point.y }],
			color: `hsl(${Math.random() * 360}, 100%, 50%)`,
		},
	});
	const pointerMoveListener = (event: MouseEvent) => {
		const point = getCursorPoint(event);
		store.pushContinuousOperationData(activeOperation.operationId, {
			points: { x: point.x, y: point.y },
		});
	};
	const pointerUpListener = () => {
		document.removeEventListener("pointermove", pointerMoveListener);
		document.removeEventListener("pointerup", pointerUpListener);
	};
	document.addEventListener("pointermove", pointerMoveListener);
	document.addEventListener("pointerup", pointerUpListener);
});

// Instead of adding a listener for each brush stroke to handle new points coming in,
// we can use a map of operation IDs to update handlers.
// This should be a little more efficient as the history gets long, being O(1) instead of O(n),
// for the lookup, although the map is still growing indefinitely.
// Who can say when a brush stroke has truly ended? (TODO: us, we can say)
const updateHandlers = new Map<string, (operation: Operation, update: ContinuousOperationUpdate) => void>();
const operationHandlers = {
	circle: (operation: Operation<CircleOpData>) => {
		const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		circle.setAttribute("cx", String(operation.data.x));
		circle.setAttribute("cy", String(operation.data.y));
		circle.setAttribute("r", "10");
		circle.setAttribute("fill", operation.data.color);
		svg.appendChild(circle);
	},
	brush: (operation: Operation<BrushOpData>) => {
		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute("stroke", operation.data.color);
		path.setAttribute("fill", "none");
		path.setAttribute("d", `M ${operation.data.points.map((point) => `${point.x} ${point.y}`).join(" L ")}`);
		svg.appendChild(path);
		updateHandlers.set(operation.operationId, (updatedOperation, _update) => {
			// @ts-ignore
			path.setAttribute("d", `M ${updatedOperation.data.points.map((point) => `${point.x} ${point.y}`).join(" L ")}`);
		});
	},
};

store.onAnyOperation((operation) => {
	if (operationHandlers[operation.data.type]) {
		// @ts-ignore
		operationHandlers[operation.data.type](operation);
	} else {
		console.warn(`Unknown operation type: ${operation.data.type}`);
	}
});

store.onAnyOperationUpdated((operation, data) => {
	if (updateHandlers.has(operation.operationId)) {
		updateHandlers.get(operation.operationId)!(operation, data);
	}
});

