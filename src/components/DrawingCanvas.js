import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './DrawingCanvas.css';

class DrawingCanvas extends Component {
	constructor() {
		super();
		// this.state = {gesture: null};
		this.gesture = null;
		
		this.opCanvas = document.createElement("canvas");
		this.opCtx = this.opCanvas.getContext("2d");
		this.docCanvas = document.createElement("canvas");
		this.docCtx = this.docCanvas.getContext("2d");

		this.opCanvas.width = 640;
		this.opCanvas.height = 480;
		this.docCanvas.width = 640;
		this.docCanvas.height = 480;
	}
	render() {
		return (
			<canvas className="DrawingCanvas" width="640" height="480"></canvas>
		);
	}
	toCanvasCoords(event) {
		const canvas = ReactDOM.findDOMNode(this);
		const rect = canvas.getBoundingClientRect();
		return {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top
		};
	}
	// TODO: touch support
	onMouseMoveWhileDown(event) {
		event.preventDefault();

		const canvas = ReactDOM.findDOMNode(this);
		const ctx = canvas.getContext("2d");
		const {opCanvas, opCtx, docCanvas, docCtx} = this;

		const {startPos, lastPos, tool, swatch} = this.gesture;
		const pos = this.toCanvasCoords(event);
		this.gesture.lastPos = pos;

		if (tool.drawShape) {
			opCtx.clearRect(0, 0, opCanvas.width, opCanvas.height);
			tool.drawShape(opCtx, startPos.x, startPos.y, pos.x, pos.y, swatch);
		} else {
			// TODO: smoothing
			tool.drawSegmentOfPath(opCtx, lastPos.x, lastPos.y, pos.x, pos.y, swatch);
		}

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(docCanvas, 0, 0);
		ctx.drawImage(opCanvas, 0, 0);
		
		// TODO: collaborative sync with undo/redo
	}
	onMouseDown(event) {
		event.preventDefault();
		const {selectedSwatch, selectedTool} = this.props;
		const pos = this.toCanvasCoords(event);
		this.gesture = {startPos: pos, lastPos: pos, tool: selectedTool, swatch: selectedSwatch};
		if (event.target.setCapture) {
			event.target.setCapture();
		} else {
			document.body.classList.add("cursor-override-DrawingCanvas");
		}
	}
	onMouseUp(event) {
		const pos = this.toCanvasCoords(event);
		this.gesture.lastPos = pos;
		this.gesture.endPos = pos;
		document.body.classList.remove("cursor-override-DrawingCanvas");

		const {opCanvas, opCtx, docCanvas, docCtx} = this;
		docCtx.drawImage(opCanvas, 0, 0);
		opCtx.clearRect(0, 0, opCanvas.width, opCanvas.height);
	}
	componentDidMount() {
		const canvas = ReactDOM.findDOMNode(this);
		canvas.addEventListener("mousedown", this.mouseDownListener = (event)=> {
			this.onMouseDown(event);
			window.addEventListener("mousemove", this.mouseMoveListener = (event)=> {
				this.onMouseMoveWhileDown(event);
			});
			window.addEventListener("mouseup", this.mouseUpListener = (event)=> {
				window.removeEventListener("mousemove", this.mouseMoveListener);
				window.removeEventListener("mouseup", this.mouseUpListener);
				this.onMouseUp(event);
			});
		});
	}
	componentWillUnmount() {
		const canvas = ReactDOM.findDOMNode(this);
		canvas.removeEventListener("mousedown", this.mouseDownListener);
		window.removeEventListener("mousemove", this.mouseMoveListener);
		window.removeEventListener("mouseup", this.mouseUpListener);
	}
}

export default DrawingCanvas;
