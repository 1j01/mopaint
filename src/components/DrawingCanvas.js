import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './DrawingCanvas.css';

class DrawingCanvas extends Component {
	constructor() {
		super();
		// this.state = {gesture: null};
		this.gesture = null;
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
		const {startPos, lastPos, tool, swatch} = this.gesture;
		const pos = this.toCanvasCoords(event);
		this.gesture.lastPos = pos;
		
		if (tool.drawShape) {
			tool.drawShape(ctx, startPos.x, startPos.y, pos.x, pos.y, swatch);
		} else {
			// TODO: smoothing
			tool.drawSegmentOfPath(ctx, lastPos.x, lastPos.y, pos.x, pos.y, swatch);
		}
		
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
