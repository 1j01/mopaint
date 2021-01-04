import React, { Component } from "react";
import PropTypes from "prop-types";
import "./DrawingCanvas.css";
import {draw} from "../engine.js";
import {generateID} from "../helpers.js";

class DrawingCanvas extends Component {
	constructor(props) {
		super(props);

		this.operation = null;
		this.mousePos = null;

		this.canvasRef = React.createRef();

		this.cache = {};
		// hashes of operations up to and including the given operation in the document
		this.hashInDocumentByOperation = new Map();
	}
	draw() {
		if (this.animationFrameID) {
			cancelAnimationFrame(this.animationFrameID);
		}
		this.animationFrameID = requestAnimationFrame(()=> {
			draw({
				documentCanvas: this.canvasRef.current,
				operations: this.props.operations,
				thumbnailsByOperation: this.props.thumbnailsByOperation,
				cache: this.cache,
				hashInDocumentByOperation: this.hashInDocumentByOperation,
			});

			if (this.mousePos) {
				const canvas = this.canvasRef.current;
				const ctx = canvas.getContext("2d");
				const symmetryPoints = this.props.selectedTool.getSymmetryPoints(ctx, this.mousePos);
				for (const point of symmetryPoints) {
					ctx.beginPath();
					ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
					ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
					ctx.fill();
				}
			}
		});
	}
	render() {
		this.draw();
		const width = 640;
		const height = 480;
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
	// TODO: touch support
	onMouseMove(event) {
		this.mousePos = this.toCanvasCoords(event);

		if (this.props.selectedTool.getSymmetryPoints) {
			this.draw();
		}
	}
	onMouseMoveWhileDown(event) {
		event.preventDefault();

		const pos = this.toCanvasCoords(event);
		if (!this.operation) {
			return;
		}
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
		if (!selectedTool) {
			console.warn("no tool selected");
			return;
		}
		const pos = this.toCanvasCoords(event);
		this.operation = {
			id: generateID(10),
			points: [pos],
			tool: selectedTool,
			swatch: selectedSwatch,
			updatingContinously: true, // TODO: this should probably be extrinsic!
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
		// TODO: add pos if different? (is that possible? and does this matter?)
		// const pos = this.toCanvasCoords(event);
		// this.operation.points.push(pos);

		const { updateOperation } = this.props;
		if (!this.operation) {
			return;
		}
		delete this.operation.updatingContinously; // bit of a hack so let's uh clean it up / make it less present in the document store... (as opposed to setting it to false)
		updateOperation(this.operation);

		document.body.classList.remove("cursor-override-DrawingCanvas");
	}
	componentDidMount() {
		const canvas = this.canvasRef.current;
		let mouseIsDown = false;
		canvas.addEventListener("mousemove", this.mouseMoveListener = (event)=> {
			this.onMouseMove(event);
		});
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
					(this.mouseMoveWhileDownListener = (event) => {
						this.onMouseMoveWhileDown(event);
					})
				);
				window.addEventListener(
					"mouseup",
					(this.mouseUpListener = (event) => {
						window.removeEventListener("mousemove", this.mouseMoveWhileDownListener);
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
		window.removeEventListener("mousemove", this.mouseMoveWhileDownListener);
		window.removeEventListener("mouseup", this.mouseUpListener);
		cancelAnimationFrame(this.animationFrameID);
	}
}

DrawingCanvas.propTypes = {
	selectedTool: PropTypes.object,
	selectedSwatch: PropTypes.oneOfType([
		PropTypes.string,
		PropTypes.instanceOf(CanvasGradient),
		PropTypes.instanceOf(CanvasPattern),
	]).isRequired,
};

export default DrawingCanvas;
