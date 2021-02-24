import React, { Component } from "react";
import PropTypes from "prop-types";
import "./DrawingCanvas.css";
import { draw } from "../engine.js";
import { generateID } from "../helpers.js";
import LoadingIndicator from "./LoadingIndicator";

class DrawingCanvas extends Component {
	constructor(props) {
		super(props);

		this.operation = null;
		this.pointerPos = null;
		this.pointerOverCanvas = false;
		this.hoveredPathOp = null;
		this.editingPathOp = null;
		this.doubleClickTimer = 0;
		this.doubleClickTime = 500;

		this.canvasRef = React.createRef();

		this.cache = {};
		// hashes of operations up to and including the given operation in the document
		this.hashInDocumentByOperation = new Map();
	}
	draw() {
		if (this.animationFrameID) {
			cancelAnimationFrame(this.animationFrameID);
		}
		this.animationFrameID = requestAnimationFrame(() => {
			draw({
				documentCanvas: this.canvasRef.current,
				operations: this.props.operations,
				thumbnailsByOperation: this.props.thumbnailsByOperation,
				cache: this.cache,
				hashInDocumentByOperation: this.hashInDocumentByOperation,
			});

			// show preview dots for symmetry if the pointer is over the canvas OR the pointer is down, actively interacting with the canvas
			if ((this.pointerOverCanvas || this.operation) && this.props.selectedTool.getSymmetryPoints && this.pointerPos) {
				const canvas = this.canvasRef.current;
				const ctx = canvas.getContext("2d");
				const symmetryPoints = this.props.selectedTool.getSymmetryPoints(ctx, this.pointerPos);
				for (const point of symmetryPoints) {
					ctx.beginPath();
					ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
					ctx.fillStyle = "#fff";
					ctx.fill();
					ctx.strokeStyle = "#000";
					ctx.lineWidth = 1;
					ctx.stroke();
				}
			}

			if (this.props.selectedTool.name === "Edit Paths") {
				this.hoveredPathOp = this.pointerOverCanvas ? this.findPathOp(this.pointerPos) : null;
				const pathOp = this.editingPathOp || this.hoveredPathOp;
				if (pathOp) {
					const canvas = this.canvasRef.current;
					const ctx = canvas.getContext("2d");
					for (const point of pathOp.points) {
						ctx.beginPath();
						ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
						ctx.fillStyle = "#fff";
						ctx.fill();
						ctx.strokeStyle = "#000";
						ctx.lineWidth = 1;
						ctx.stroke();
					}
				}
			} else {
				this.hoveredPathOp = null;
			}
		});
	}
	render() {
		this.draw();
		const width = 640;
		const height = 480;
		return (
			<div className="DrawingCanvas" style={{ width, height, position: "relative", cursor: this.props.selectedTool.name === "Edit Paths" ? "default" : "crosshair" }}>
				<canvas width={width} height={height} ref={this.canvasRef} />
				{!this.props.loaded && <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
					<LoadingIndicator />
				</div>}
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
	onPointerMove(event) {
		this.pointerPos = this.toCanvasCoords(event);

		if (this.props.selectedTool.getSymmetryPoints || this.props.selectedTool.name === "Edit Paths") {
			this.draw();
		}
	}
	onPointerLeave() {
		this.pointerOverCanvas = false;

		if (this.props.selectedTool.getSymmetryPoints || this.props.selectedTool.name === "Edit Paths") {
			this.draw();
		}
	}
	onPointerEnter() {
		this.pointerOverCanvas = true;
		// will also get a pointermove event which will cause redraw
	}
	onPointerMoveWhileDown(event) {
		event.preventDefault();

		this.pointerPos = this.toCanvasCoords(event);
		if (!this.operation) {
			return;
		}
		this.operation.points.push(this.pointerPos);

		const { updateOperation } = this.props;
		updateOperation(this.operation);
	}
	findPathOp(pos) {
		// TODO: a sense of occlusion, path width, etc.
		for (const op of this.props.operations) {
			if (op.points) {
				for (const point of op.points) {
					if (Math.hypot(point.x - pos.x, point.y - pos.y) < 10) {
						return op;
					}
				}
			}
		}
	}
	onPointerDown(event) {
		if (event.which !== 1) {
			return;
		}
		event.preventDefault();
		const { selectedSwatch, selectedTool } = this.props;
		if (!selectedTool) {
			console.warn("no tool selected");
			return;
		}
		this.pointerPos = this.toCanvasCoords(event);

		if (selectedTool.name === "Edit Paths") {
			if (Date.now() - this.doubleClickTimer < this.doubleClickTime) {
				if (this.editingPathOp) {
					this.editingPathOp = null;
				} else {
					this.editingPathOp = this.hoveredPathOp;
				}
				this.doubleClickTimer = 0;
			} else {
				this.doubleClickTimer = Date.now();
			}
		} else {
			this.operation = {
				id: generateID(10),
				points: [this.pointerPos],
				tool: selectedTool,
				swatch: selectedSwatch,
				updatingContinously: true, // TODO: this should probably be extrinsic!
			};
			const { addOperation } = this.props;
			addOperation(this.operation);
		}
		if (event.target.setCapture) {
			event.target.setCapture();
		} else {
			document.body.classList.add("cursor-override");
			document.body.style.cursor = this.canvasRef.current.style.cursor;
		}
	}
	onPointerUp() {
		// TODO: add position if different? (is that possible? and does this matter?)
		// this.pointerPos = this.toCanvasCoords(event);
		// this.operation.points.push(this.pointerPos);

		const { updateOperation } = this.props;
		if (!this.operation) {
			return;
		}
		delete this.operation.updatingContinously; // bit of a hack so let's uh clean it up / make it less present in the document store... (as opposed to setting it to false)
		updateOperation(this.operation);
		this.operation = null;

		document.body.classList.remove("cursor-override");
		document.body.style.cursor = "";
	}
	componentDidMount() {
		const canvas = this.canvasRef.current;
		let pointerIsDown = false;
		canvas.addEventListener("pointermove", this.pointerMoveListener = (event) => {
			this.onPointerMove(event);
		});
		canvas.addEventListener("pointerleave", this.pointerLeaveListener = (event) => {
			this.onPointerLeave(event);
		});
		canvas.addEventListener("pointerenter", this.pointerEnterListener = (event) => {
			this.onPointerEnter(event);
		});
		canvas.addEventListener(
			"pointerdown",
			(this.pointerDownListener = (event) => {
				if (pointerIsDown) {
					return;
				}
				if (event.button !== 0) {
					return;
				}
				pointerIsDown = true;
				this.onPointerDown(event);
				window.addEventListener(
					"pointermove",
					(this.pointerMoveWhileDownListener = (event) => {
						this.onPointerMoveWhileDown(event);
					})
				);
				window.addEventListener(
					"pointerup",
					(this.pointerUpListener = (event) => {
						window.removeEventListener("pointermove", this.pointerMoveWhileDownListener);
						window.removeEventListener("pointerup", this.pointerUpListener);
						pointerIsDown = false;
						this.onPointerUp(event);
					})
				);
			})
		);
	}
	componentWillUnmount() {
		const canvas = this.canvasRef.current;
		canvas.removeEventListener("pointerdown", this.pointerDownListener);
		canvas.removeEventListener("pointermove", this.pointerMoveListener);
		canvas.removeEventListener("pointerleave", this.pointerLeaveListener);
		canvas.removeEventListener("pointerenter", this.pointerEnterListener);
		window.removeEventListener("pointermove", this.pointerMoveWhileDownListener);
		window.removeEventListener("pointerup", this.pointerUpListener);
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
	loaded: PropTypes.bool.isRequired,
	thumbnailsByOperation: PropTypes.instanceOf(Map).isRequired,
	operations: PropTypes.array.isRequired,
	updateOperation: PropTypes.func.isRequired,
	addOperation: PropTypes.func.isRequired,
};

export default DrawingCanvas;
