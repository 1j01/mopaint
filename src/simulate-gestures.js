let gestureTimeoutID;
let periodicGesturesTimeoutID;

window.simulateRandomGesture = (callback) => {
	let target = document.querySelector("canvas");

	let rect = target.getBoundingClientRect();

	let triggerMouseEvent = (type, point) => {
		let event = new MouseEvent(type, {
			view: window,
			bubbles: true,
			cancelable: true,
			clientX: rect.left + point.x,
			clientY: rect.top + point.y,
		});
		target.dispatchEvent(event);
	};

	let t = 0;
	let cx = Math.random() * rect.width;
	let cy = Math.random() * rect.height;
	let gestureComponents = [];
	let numberOfComponents = 5;
	for (let i = 0; i < numberOfComponents; i += 1) {
		gestureComponents.push({
			rx:
				Math.random() *
				Math.min(rect.width, rect.height) /
				2 /
				numberOfComponents,
			ry:
				Math.random() *
				Math.min(rect.width, rect.height) /
				2 /
				numberOfComponents,
			angularFactor: Math.random() * 5 - Math.random(),
			angularOffset: Math.random() * 5 - Math.random(),
		});
	}
	let pointForTime = (t) => {
		let point = { x: cx, y: cy };
		for (let i = 0; i < gestureComponents.length; i += 1) {
			let { rx, ry, angularFactor, angularOffset } = gestureComponents[i];
			point.x +=
				Math.sin(Math.PI * 2 * (t / 100 * angularFactor + angularOffset)) * rx;
			point.y +=
				Math.cos(Math.PI * 2 * (t / 100 * angularFactor + angularOffset)) * ry;
		}
		return point;
	};
	triggerMouseEvent("mousedown", pointForTime(t));
	let move = () => {
		t += 1;
		if (t > 50) {
			triggerMouseEvent("mouseup", pointForTime(t));
			if (callback) {
				callback();
			}
		} else {
			triggerMouseEvent("mousemove", pointForTime(t));
			gestureTimeoutID = setTimeout(move, 10);
		}
	};
	move();
};

window.simulateRandomGesturesPeriodically = (delayBetweenGestures = 50) => {
	let waitThenGo = () => {
		periodicGesturesTimeoutID = setTimeout(() => {
			window.simulateRandomGesture(waitThenGo);
		}, delayBetweenGestures);
	};
	window.simulateRandomGesture(waitThenGo);
};

window.stopSimulatingGestures = () => {
	clearTimeout(gestureTimeoutID);
	clearTimeout(periodicGesturesTimeoutID);
};
