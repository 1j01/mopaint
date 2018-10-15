import React, { Component } from "react";
import PropTypes from "prop-types";
import "./DrawingCanvas.css";

// dec2hex :: Integer -> String
function dec2hex(dec) {
	return ("0" + dec.toString(16)).substr(-2);
}

// generateId :: Integer -> String
function generateId(len) {
	var arr = new Uint8Array((len || 40) / 2);
	window.crypto.getRandomValues(arr);
	return Array.from(arr, dec2hex).join("");
}

class DrawingCanvas extends Component {
	constructor(props) {
		super();

		this.gesture = null;
		// TODO: show gestures of other users in realtime
		// NOTE: should be able to support time-based tools in a reproducible way
		// with timestamps and periodic updates to the lastest timestamp
		// and support psuedorandomness by seeding from the gesture data
		// or including a seed with each update, or whatever

		this.opCanvas = document.createElement("canvas");
		this.opCtx = this.opCanvas.getContext("2d");

		const { width, height } = props.documentCanvas;
		this.opCanvas.width = width;
		this.opCanvas.height = height;

		this.canvasRef = React.createRef();
	}
	render() {
		const { width, height } = this.props.documentCanvas;
		requestAnimationFrame(this.draw.bind(this));
		return (
			<div className="DrawingCanvas" style={{ width, height }}>
				<canvas width={width} height={height} ref={this.canvasRef} />
			</div>
		);
	}
	toCanvasCoords(event) {
		const canvas = this.canvasRef.current;
		const rect = canvas.getBoundingClientRect();
		return {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
		};
	}
	draw() {
		const canvas = this.canvasRef.current;
		const { opCanvas, opCtx } = this;
		const { documentCanvas, operations } = this.props;
		const ctx = canvas.getContext("2d");

		opCtx.clearRect(0, 0, opCanvas.width, opCanvas.height);

		// TODO: cache the images and state of/after operations
		// (and TODO eventually: use bounding boxes to keep memory usage down)
		operations.forEach((operation) => {
			const { points, tool, swatch } = operation;
			const startPos = points[0];
			const lastPos = points[points.length - 1];
			if (tool.drawShape) {
				tool.drawShape(
					opCtx,
					startPos.x,
					startPos.y,
					lastPos.x,
					lastPos.y,
					swatch
				);
			}
			if (tool.drawSegmentOfPath) {
				// TODO: allow for smoothing (rather than just plain segments)
				for (let i1 = 0, i2 = 1; i2 < points.length; i1 += 1, i2 += 1) {
					tool.drawSegmentOfPath(
						opCtx,
						points[i1].x,
						points[i1].y,
						points[i2].x,
						points[i2].y,
						swatch
					);
				}
			}
			if (tool.click) {
				tool.click(opCtx, startPos.x, startPos.y, swatch, opCtx);
			}
		});

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(documentCanvas, 0, 0);
		ctx.drawImage(opCanvas, 0, 0);
	}
	// TODO: touch support
	onMouseMoveWhileDown(event) {
		event.preventDefault();

		const pos = this.toCanvasCoords(event);
		this.operation.points.push(pos);

		const { updateOperation } = this.props;
		updateOperation(this.operation);
	}
	onMouseDown(event) {
		if (event.which !== 1) {
			return;
		}
		event.preventDefault();
		const { selectedSwatch, selectedTool } = this.props;
		const pos = this.toCanvasCoords(event);
		this.operation = {
			id: generateId(10),
			points: [pos],
			tool: selectedTool,
			swatch: selectedSwatch,
		};
		const { addOperation } = this.props;
		addOperation(this.operation);
		if (event.target.setCapture) {
			event.target.setCapture();
		} else {
			document.body.classList.add("cursor-override-DrawingCanvas");
		}
	}
	onMouseUp(event) {
		// const pos = this.toCanvasCoords(event);
		// TODO: add pos if different?

		document.body.classList.remove("cursor-override-DrawingCanvas");
	}
	componentDidMount() {
		const canvas = this.canvasRef.current;
		let mouseIsDown = false;
		canvas.addEventListener(
			"mousedown",
			(this.mouseDownListener = (event) => {
				if (mouseIsDown) {
					return;
				}
				if (event.button !== 0) {
					return;
				}
				mouseIsDown = true;
				this.onMouseDown(event);
				window.addEventListener(
					"mousemove",
					(this.mouseMoveListener = (event) => {
						this.onMouseMoveWhileDown(event);
					})
				);
				window.addEventListener(
					"mouseup",
					(this.mouseUpListener = (event) => {
						window.removeEventListener("mousemove", this.mouseMoveListener);
						window.removeEventListener("mouseup", this.mouseUpListener);
						mouseIsDown = false;
						this.onMouseUp(event);
					})
				);
			})
		);
	}
	componentWillUnmount() {
		const canvas = this.canvasRef.current;
		canvas.removeEventListener("mousedown", this.mouseDownListener);
		window.removeEventListener("mousemove", this.mouseMoveListener);
		window.removeEventListener("mouseup", this.mouseUpListener);
	}
}

DrawingCanvas.propTypes = {
	documentCanvas: PropTypes.object.isRequired,
	documentContext: PropTypes.object.isRequired,
	undoable: PropTypes.func.isRequired,
	selectedTool: PropTypes.object.isRequired,
	selectedSwatch: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.instanceOf(CanvasGradient),
		PropTypes.instanceOf(CanvasPattern),
	]).isRequired,
};

export default DrawingCanvas;
