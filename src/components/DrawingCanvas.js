import React, { Component } from "react";
import PropTypes from "prop-types";
import { create as createStream } from "@most/create";
import ImageAction from "../ImageAction.js";
import "./DrawingCanvas.css";

// TODO: show gestures of other users in realtime
// NOTE: should be able to support time-based tools in a reproducible way
// with timestamps and periodic updates to the lastest timestamp
// and support psuedorandomness by seeding from the gesture data
// or including a seed with each update, or whatever

class DrawingCanvas extends Component {
	constructor(props) {
		super();

		this.opCanvas = document.createElement("canvas");
		this.opCtx = this.opCanvas.getContext("2d");

		const { width, height } = props.documentCanvas;
		this.opCanvas.width = width;
		this.opCanvas.height = height;

		this.canvasRef = React.createRef();

		this.toolCleanup = null;
	}
	render() {
		const { width, height } = this.props.documentCanvas;
		// TODO: put documentCanvas directly in the DOM,
		// with canvases representing gestures/operations on top
		return (
			<div className="DrawingCanvas" style={{ width, height }}>
				<canvas width={width} height={height} ref={this.canvasRef} />
			</div>
		);
	}
	draw() {
		const { opCanvas } = this;
		const { documentCanvas } = this.props;
		const canvas = this.canvasRef.current;
		const ctx = canvas.getContext("2d");

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(documentCanvas, 0, 0);
		ctx.drawImage(opCanvas, 0, 0);
	}
	componentDidMount() {
		this.setupSelectedToolUI();
	}
	componentDidUpdate(prevProps, prevState, snapshot) {
		if (this.props.selectedTool !== prevProps.selectedTool) {
			this.setupSelectedToolUI();
		}
	}
	setupSelectedToolUI() {
		if (this.toolCleanup) {
			this.toolCleanup();
		}

		const canvas = this.canvasRef.current;
		const { selectedTool } = this.props;

		// TODO: allow tool switching again
		// store operation data in the undo history
		// allow swapping swatches after the fact (i.e. modify the operation)

		// TODO: find a better way to do this (using subscribe().unsubscribe()?)
		const endSignal = createStream((add, end, error) => {
			this.toolCleanup = () => add("end signal");
		});

		const uiStream = selectedTool.setupUI(canvas, endSignal);

		const operationsStream = uiStream.map((pointsStream) => {
			const { opCanvas, opCtx } = this;
			const { selectedSwatch } = this.props;
			return {
				tool: selectedTool,
				swatch: selectedSwatch,
				context: opCtx,
				canvas: opCanvas,
				pointsStream,
			};
		});

		operationsStream.forEach((operation) => {
			selectedTool.renderOperation(
				operation,
				this.makeAction.bind(this),
				this.draw.bind(this)
			);
		});
	}
	makeAction() {
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
