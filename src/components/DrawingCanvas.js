import React, { Component } from "react";
import PropTypes from "prop-types";
import "./DrawingCanvas.css";

const byteToHex = (byte) => `0${byte.toString(16)}`.slice(-2);
const generateID = (length = 40) => {
	// length must be an even number (default: 40)
	const array = new Uint8Array(length / 2);
	crypto.getRandomValues(array);
	return Array.from(array, byteToHex).join("");
};

class DrawingCanvas extends Component {
	constructor(props) {
		super();

		this.operation = null;

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
		const { documentCanvas, documentContext, operations } = this.props;
		const ctx = canvas.getContext("2d");

		documentContext.clearRect(0, 0, opCanvas.width, opCanvas.height);

		// TODO: cache the images/state of/after operations
		// (and TODO eventually: use bounding boxes to keep memory usage down)
		// (and parts of the cache could be saved in the file and even shared in a collaborative setting
		// but we'll need good cache invalidation)
		// (it could fetch the cached data for the latest state of the document
		// and then load earlier stuff if you toggle/undo operations,
		// and it could simultaneously kick off rendering for them, so whichever is faster,
		// the network or your computer, could win and show you the results)
		operations.forEach((operation) => {
			opCtx.clearRect(0, 0, opCanvas.width, opCanvas.height);

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
				tool.click(documentContext, startPos.x, startPos.y, swatch, opCtx);
			}

			documentContext.drawImage(opCanvas, 0, 0);
			// this is all super inefficient btw, without implementing caching
			operation.thumbnail = document.createElement("canvas");
			operation.thumbnail.width = 64;
			operation.thumbnail.height = 64;
			operation.thumbnail.getContext("2d").drawImage(opCanvas, 0, 0, 64, 64); // TODO: proportional and whatever
			// can reuse code in ToolPreview.js
		});

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(documentCanvas, 0, 0);
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
			id: generateID(10),
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
	selectedTool: PropTypes.object.isRequired,
	selectedSwatch: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.instanceOf(CanvasGradient),
		PropTypes.instanceOf(CanvasPattern),
	]).isRequired,
};

export default DrawingCanvas;
