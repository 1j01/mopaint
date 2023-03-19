import React, { Component } from "react";
import PropTypes from "prop-types";
import "./DrawingCanvas.css";
import { draw } from "../engine.js";
import { generateID } from "../helpers.js";
import LoadingIndicator from "./LoadingIndicator";


const distanceSquared = (v, w) => (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
const distance = (v, w) => Math.sqrt(distanceSquared(v, w));
const distanceToLineSegmentSquared = (p, v, w) => {
	const l2 = distanceSquared(v, w);
	if (l2 === 0) {
		return distanceSquared(p, v);
	}
	let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
	t = Math.max(0, Math.min(1, t));
	return distanceSquared(p, {
		x: v.x + t * (w.x - v.x),
		y: v.y + t * (w.y - v.y),
	});
};
const distanceToLineSegment = (p, v, w) =>
	Math.sqrt(distanceToLineSegmentSquared(p, v, w));

const distanceToPath = (pathOp, fromPoint) => {
	let closestDist = Infinity;

	for (let i = 1; i < pathOp.points.length; i += 1) {
		const a = pathOp.points[i - 1];
		const b = pathOp.points[i];
		const dist = distanceToLineSegment(fromPoint, a, b);
		// dist = Math.max(0, dist - segment.width / 2) if segment.width
		closestDist = Math.min(closestDist, dist);
	}

	// Case 1: single-point path, should be selectable.
	// Case 2:
	// A
	// |
	// |
	// | x C----------D
	// |
	// |
	// B
	// Should probably select the line with the nearer point,
	// since you might be clicking on visible points to try to select something.
	for (const point of pathOp.points) {
		const dist = distance(fromPoint, point);
		// dist = Math.max(0, dist - segment.radius) if segment.radius or point.radius
		closestDist = Math.min(closestDist, dist);
	}

	return closestDist;
};
class DrawingCanvas extends Component {
	constructor(props) {
		super(props);

		this.operation = null;
		this.pointerPos = null;
		this.pointerOverCanvas = false;
		this.hoveredPathOp = null;
		this.editingPathOp = null;
		this.hoveredPoints = [];
		this.selectedPoints = [];
		this.doubleClickTimer = 0;
		this.doubleClickPos = null;
		this.doubleClickMaxTime = 500;
		this.doubleClickMaxDistance = 10;
		this.selectionBox = null;

		this.canvasRef = React.createRef();

		this.cache = {};
		// hashes of operations up to and including the given operation in the document
		this.hashInDocumentByOperation = new Map();

		const transparencyPatternCanvas = document.createElement("canvas");
		const transparencyPatternContext = transparencyPatternCanvas.getContext("2d");
		transparencyPatternCanvas.width = 16;
		transparencyPatternCanvas.height = 16;
		transparencyPatternContext.fillStyle = "#fff";
		transparencyPatternContext.fillRect(0, 0, transparencyPatternCanvas.width, transparencyPatternCanvas.height);
		transparencyPatternContext.fillStyle = "#ccc";
		transparencyPatternContext.fillRect(0, 0, transparencyPatternCanvas.width / 2, transparencyPatternCanvas.height / 2);
		transparencyPatternContext.fillRect(transparencyPatternCanvas.width / 2, transparencyPatternCanvas.height / 2, transparencyPatternCanvas.width / 2, transparencyPatternCanvas.height / 2);
		this.transparencyPattern = transparencyPatternContext.createPattern(transparencyPatternCanvas, "repeat");
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

			const canvas = this.canvasRef.current;
			const ctx = canvas.getContext("2d");

			ctx.save();
			ctx.fillStyle = this.transparencyPattern;
			ctx.globalCompositeOperation = "destination-over";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.restore();

			// show preview dots for symmetry if the pointer is over the canvas OR the pointer is down, actively interacting with the canvas
			if ((this.pointerOverCanvas || this.operation) && this.props.selectedTool.getSymmetryPoints && this.pointerPos) {
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
				// if (this.pointerOverCanvas) assert(this.pointerPos);
				this.hoveredPathOp = this.pointerOverCanvas ? this.closestPathOp(this.pointerPos) : null;
				// const hoveredPoint = this.pointerPos ? (this.hoveredPathOp ? this.closestPoint(this.pointerPos, [this.hoveredPathOp]) : this.closestPoint(this.pointerPos, this.props.operations))?.closestPoint : null;
				// if (this.hoveredPathOp) assert(this.pointerPos);
				const hoveredPoint = this.editingPathOp ? this.closestPoint(this.pointerPos, [this.editingPathOp])?.closestPoint : null;
				this.hoveredPoints = hoveredPoint ? [hoveredPoint] : [];
				if (this.selectionBox) {
					this.hoveredPoints = this.pointsWithinSelectionBox(this.editingPathOp ? [this.editingPathOp] : this.props.operations);
				}
				ctx.beginPath();
				ctx.save();
				ctx.fillStyle = "#ccc";
				ctx.strokeStyle = "#fff";
				ctx.lineWidth = 2;
				ctx.translate(-1.5, -1.5);
				if (this.editingPathOp) {
					for (const point of this.editingPathOp.points) {
						if (!this.hoveredPoints.includes(point) && !this.selectedPoints.includes(point)) {
							ctx.rect(point.x, point.y, 3, 3);
						}
					}
					ctx.globalCompositeOperation = "difference";
					ctx.stroke();
					ctx.globalCompositeOperation = "source-over";
					ctx.fill();
				}
				if (this.hoveredPoints.length) {
					ctx.beginPath();
					for (const point of this.hoveredPoints) {
						ctx.rect(point.x, point.y, 3, 3);
					}
					ctx.fillStyle = "#f00";
					ctx.strokeStyle = "#fff";
					ctx.globalCompositeOperation = "difference";
					ctx.stroke();
					ctx.globalCompositeOperation = "source-over";
					ctx.fill();
				}
				if (this.selectedPoints.length) {
					ctx.beginPath();
					ctx.translate(-1, -1);
					for (const point of this.selectedPoints) {
						if (!this.hoveredPoints.includes(point)) {
							ctx.rect(point.x, point.y, 5, 5);
						}
					}
					ctx.fillStyle = "#00f";
					ctx.strokeStyle = "#fff";
					ctx.globalCompositeOperation = "difference";
					ctx.stroke();
					ctx.fill();
				}
				ctx.restore();
				if (this.hoveredPathOp && !this.editingPathOp && !this.selectionBox) {
					ctx.beginPath();
					ctx.strokeStyle = "#f00";
					ctx.lineWidth = 1.5;
					ctx.moveTo(this.hoveredPathOp.points[0].x, this.hoveredPathOp.points[0].y);
					for (let i = 1; i < this.hoveredPathOp.points.length; i += 1) {
						ctx.lineTo(this.hoveredPathOp.points[i].x, this.hoveredPathOp.points[i].y);
					}
					ctx.stroke();
				}
				if (this.selectionBox) {
					ctx.save();
					ctx.beginPath();
					ctx.translate(0.5, 0.5); // if view.scale is 1
					ctx.rect(this.selectionBox.x1, this.selectionBox.y1, this.selectionBox.x2 - this.selectionBox.x1, this.selectionBox.y2 - this.selectionBox.y1);
					ctx.fillStyle = "rgba(0, 155, 255, 0.1)";
					ctx.strokeStyle = "rgba(0, 155, 255, 0.8)";
					ctx.lineWidth = 1; // 1 / view.scale;
					ctx.fill();
					ctx.stroke();
					ctx.restore();
				}
			} else {
				this.hoveredPathOp = null;
				this.hoveredPoints = [];
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
		if (this.selectionBox) {
			this.selectionBox.x2 = this.pointerPos.x;
			this.selectionBox.y2 = this.pointerPos.y;
		}
		if (!this.operation) {
			return;
		}
		this.operation.points.push(this.pointerPos);

		const { updateOperation } = this.props;
		updateOperation(this.operation);
	}
	closestPathOp(pos) {
		// TODO: a sense of path width, shape, symmetry, occlusion etc.
		const minGrabDist = 10;
		let closestDist = Infinity;
		let closestOp = null;
		for (const op of this.props.operations) {
			if (op.points) {
				const dist = distanceToPath(op, pos);
				if (dist < minGrabDist && dist < closestDist) {
					closestOp = op;
					closestDist = dist;
				}
			}
		}
		if (closestOp) {
			return closestOp;
		}
	}
	closestPoint(pos, operations) {
		const minGrabDist = 10;
		let closestDist = Infinity;
		let closestPointOp = null;
		let closestPoint = null;
		for (const op of operations) {
			if (op.points) {
				for (const point of op.points) {
					const dist = distance(point, pos);
					if (dist < minGrabDist && dist < closestDist) {
						closestPointOp = op;
						closestPoint = point;
						closestDist = dist;
					}
				}
			}
		}
		if (closestPoint) {
			return { closestPoint, closestPointOp };
		}
	}
	pointsWithinSelectionBox(operations = this.props.operations) {
		if (!this.selectionBox) {
			return [];
		}
		const { x1, y1, x2, y2 } = this.selectionBox;
		const points = [];
		for (const op of operations) {
			if (op.points) {
				for (const point of op.points) {
					const minX = Math.min(x1, x2);
					const maxX = Math.max(x1, x2);
					const minY = Math.min(y1, y2);
					const maxY = Math.max(y1, y2);
					if (
						minX <= point.x && point.x <= maxX &&
						minY <= point.y && point.y <= maxY &&
						minX <= point.x && point.x <= maxX &&
						minY <= point.y && point.y <= maxY
					) {
						points.push(point);
					}
				}
			}
		}
		return points;
	}
	selectAll() {
		if (this.editingPathOp) {
			this.selectedPoints = [...this.editingPathOp.points];
		} else {
			this.selectedPoints = [];
			for (const op of this.props.operations) {
				if (op.points) {
					for (const point of op.points) {
						this.selectedPoints.push(point);
					}
				}
			}
		}
		this.draw();
	}
	deselect() {
		this.editingPathOp = null;
		this.selectedPoints = [];
		this.draw();
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
			if (
				Date.now() - this.doubleClickTimer < this.doubleClickMaxTime &&
				distance(this.pointerPos, this.doubleClickPos) < this.doubleClickMaxDistance &&
				!(
					this.editingPathOp &&
					(this.hoveredPathOp === this.editingPathOp || this.hoveredPoints.length)
				)
			) {
				if (this.editingPathOp) {
					this.editingPathOp = null;
				} else {
					this.editingPathOp = this.hoveredPathOp;
				}
				this.selectedPoints = [];
				this.doubleClickTimer = 0;
			} else {
				this.doubleClickTimer = (this.editingPathOp && this.hoveredPathOp === this.editingPathOp) ? 0 : Date.now();
				this.doubleClickPos = this.pointerPos;
				if (this.hoveredPoints.length) {
					// Leaving open Shift for potentially doing a range selection analogous to text editors / file browsers.
					// (Inkscape uses Shift for this.)
					this.selectPoints(this.hoveredPoints, event.ctrlKey);
				}
				if (this.editingPathOp ? (this.hoveredPoints.length === 0 && this.hoveredPathOp !== this.editingPathOp) : !this.hoveredPathOp) {
					this.selectionBox = { x1: this.pointerPos.x, y1: this.pointerPos.y, x2: this.pointerPos.x, y2: this.pointerPos.y };
					// if (!event.ctrlKey) {
					// 	this.selectedPoints = [];
					// }
				}
			}
			this.draw();
		} else {
			this.operation = {
				id: generateID(10),
				points: [this.pointerPos],
				tool: selectedTool,
				swatch: selectedSwatch,
				updatingContinuously: true, // TODO: this should probably be extrinsic!
			};
			const { addOperation } = this.props;
			addOperation(this.operation);
		}
		if (event.target.setPointerCapture) {
			event.target.setPointerCapture(event.pointerId);
		} else if (event.target.setCapture) {
			event.target.setCapture();
		} else {
			document.body.classList.add("cursor-override");
			document.body.style.cursor = this.canvasRef.current.style.cursor;
		}
	}
	selectPoints(hoveredPoints, toggle) {
		if (toggle) {
			for (const hoveredPoint of hoveredPoints) {
				if (this.selectedPoints.includes(hoveredPoint)) {
					this.selectedPoints.splice(this.selectedPoints.indexOf(hoveredPoint), 1);
				} else {
					this.selectedPoints.push(hoveredPoint);
				}
			}
		} else {
			this.selectedPoints = hoveredPoints;
		}
	}
	onPointerUp(event) {
		// TODO: add position if different? (is that possible? and does this matter?)
		// this.pointerPos = this.toCanvasCoords(event);
		// this.operation.points.push(this.pointerPos);

		const { updateOperation } = this.props;
		if (this.selectionBox) {
			this.selectPoints(this.hoveredPoints, event.ctrlKey);
			this.selectionBox = null;
			this.draw();
		}
		if (!this.operation) {
			return;
		}
		delete this.operation.updatingContinuously; // bit of a hack so let's uh clean it up / make it less present in the document store... (as opposed to setting it to false)
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
		// PropTypes.instanceOf(CanvasGradient),
		// PropTypes.instanceOf(CanvasPattern),
	]).isRequired,
	loaded: PropTypes.bool.isRequired,
	thumbnailsByOperation: PropTypes.instanceOf(Map).isRequired,
	operations: PropTypes.array.isRequired,
	updateOperation: PropTypes.func.isRequired,
	addOperation: PropTypes.func.isRequired,
};

export default DrawingCanvas;
