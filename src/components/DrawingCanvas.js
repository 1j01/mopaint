import React, { Component } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import ImageAction from "../ImageAction.js";
import "./DrawingCanvas.css";

class DrawingCanvas extends Component {
	constructor(props) {
		super();

		// this.gesture = null;
		// TODO: show gestures of other users in realtime
		// NOTE: should be able to support time-based tools in a reproducible way
		// with timestamps and periodic updates to the lastest timestamp
		// and support psuedorandomness by seeding from the gesture data
		// or including a seed with each update, or whatever
		// this.state = {gestures: new List()]};

		this.opCanvas = document.createElement("canvas");
		this.opCtx = this.opCanvas.getContext("2d");

		const { width, height } = props.documentCanvas;
		this.opCanvas.width = width;
		this.opCanvas.height = height;
	}
	render() {
		const { width, height } = this.props.documentCanvas;
		// TODO: put documentCanvas directly in the DOM,
		// with canvases representing gestures/operations on top
		return (
			<div className="DrawingCanvas" style={{ width, height }}>
				<canvas
					width={width}
					height={height}
					ref={(canvas) => {
						this.canvas = canvas;
					}}
				/>
			</div>
		);
	}
	// toCanvasCoords(event) {
	// 	const { canvas } = this;
	// 	const rect = canvas.getBoundingClientRect();
	// 	return {
	// 		x: event.clientX - rect.left,
	// 		y: event.clientY - rect.top,
	// 	};
	// }
	draw() {
		const { canvas, opCanvas } = this;
		const { documentCanvas } = this.props;
		const ctx = canvas.getContext("2d");

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(documentCanvas, 0, 0);
		ctx.drawImage(opCanvas, 0, 0);
	}
	// TODO: touch support
	// TODO: add back some of this stuff like setCapture
	// onMouseMoveWhileDown(event) {
	// 	event.preventDefault();

	// 	const { opCanvas, opCtx } = this;

	// 	const { startPos, lastPos, tool, swatch } = this.gesture;
	// 	const pos = this.toCanvasCoords(event);
	// 	this.gesture.lastPos = pos;

	// 	if (tool.drawShape) {
	// 		opCtx.clearRect(0, 0, opCanvas.width, opCanvas.height);
	// 		tool.drawShape(opCtx, startPos.x, startPos.y, pos.x, pos.y, swatch);
	// 	}
	// 	if (tool.drawSegmentOfPath) {
	// 		// TODO: smoothing (instead of just segments)
	// 		tool.drawSegmentOfPath(opCtx, lastPos.x, lastPos.y, pos.x, pos.y, swatch);
	// 	}

	// 	this.draw();
	// 	// TODO: collaborative sync with undo/redo...
	// }
	// onMouseDown(event) {
	// 	if (event.which !== 1) {
	// 		return;
	// 	}
	// 	event.preventDefault();
	// 	const { selectedSwatch, selectedTool } = this.props;
	// 	const pos = this.toCanvasCoords(event);
	// 	this.gesture = {
	// 		startPos: pos,
	// 		lastPos: pos,
	// 		tool: selectedTool,
	// 		swatch: selectedSwatch,
	// 	};
	// 	if (event.target.setCapture) {
	// 		event.target.setCapture();
	// 	} else {
	// 		document.body.classList.add("cursor-override-DrawingCanvas");
	// 	}
	// 	const { opCtx } = this;
	// 	const { documentContext } = this.props;
	// 	if (selectedTool.click) {
	// 		selectedTool.click(opCtx, pos.x, pos.y, selectedSwatch, documentContext);
	// 		this.draw();
	// 	}
	// }
	// onMouseUp(event) {
	// 	const pos = this.toCanvasCoords(event);
	// 	this.gesture.lastPos = pos;
	// 	this.gesture.endPos = pos;
	// 	document.body.classList.remove("cursor-override-DrawingCanvas");

	// 	const { opCanvas, opCtx } = this;
	// 	const { undoable, selectedTool } = this.props;
	// 	// TODO: create action from subsection of the canvas
	// 	const action = new ImageAction(
	// 		opCtx,
	// 		0,
	// 		0,
	// 		selectedTool,
	// 		selectedTool.name
	// 	);
	// 	undoable(action);
	// 	opCtx.clearRect(0, 0, opCanvas.width, opCanvas.height);
	// }
	componentDidMount() {
		const canvas = ReactDOM.findDOMNode(this);
		// let mouseIsDown = false;
		// canvas.addEventListener(
		// 	"mousedown",
		// 	(this.mouseDownListener = (event) => {
		// 		if (mouseIsDown) {
		// 			return;
		// 		}
		// 		if (event.button !== 0) {
		// 			return;
		// 		}
		// 		mouseIsDown = true;
		// 		this.onMouseDown(event);
		// 		window.addEventListener(
		// 			"mousemove",
		// 			(this.mouseMoveListener = (event) => {
		// 				this.onMouseMoveWhileDown(event);
		// 			})
		// 		);
		// 		window.addEventListener(
		// 			"mouseup",
		// 			(this.mouseUpListener = (event) => {
		// 				window.removeEventListener("mousemove", this.mouseMoveListener);
		// 				window.removeEventListener("mouseup", this.mouseUpListener);
		// 				mouseIsDown = false;
		// 				this.onMouseUp(event);
		// 			})
		// 		);
		// 	})
		// );
		const { selectedSwatch, selectedTool /*, documentContext*/ } = this.props;
		// const op = new selectedTool(documentContext, selectedSwatch);
		// op.addListeners/setup(canvas);
		selectedTool.setup(
			canvas,
			this.opCtx,
			this.makeAction.bind(this),
			this.draw.bind(this),
			selectedSwatch
		); //, documentContext
	}
	makeAction() {
		// console.log(this, "makeAction");
		const { opCanvas, opCtx } = this;
		const { undoable, selectedTool } = this.props;
		// TODO: create action from subsection of the canvas
		const action = new ImageAction(
			opCtx,
			0,
			0,
			selectedTool,
			selectedTool.name
		);
		undoable(action);
		opCtx.clearRect(0, 0, opCanvas.width, opCanvas.height);
	}
	// componentWillUnmount() {
	// 	const canvas = ReactDOM.findDOMNode(this);
	// 	canvas.removeEventListener("mousedown", this.mouseDownListener);
	// 	window.removeEventListener("mousemove", this.mouseMoveListener);
	// 	window.removeEventListener("mouseup", this.mouseUpListener);
	// }
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
