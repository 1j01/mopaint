// TODO: evaluate other hashing libraries
// https://brillout.github.io/test-javascript-hash-implementations/
import sha256 from "hash.js/lib/hash/sha/256";
import React, { Component } from "react";
import PropTypes from "prop-types";
import "./DrawingCanvas.css";

// TODO maybe: more efficient IDs (don't need to restrict the alphabet to hex)
const byteToHex = (byte) => `0${byte.toString(16)}`.slice(-2);
const generateID = (length = 40) => {
	// length must be an even number (default: 40)
	const array = new Uint8Array(length / 2);
	crypto.getRandomValues(array);
	return Array.from(array, byteToHex).join("");
};

class DrawingCanvas extends Component {
	constructor(props) {
		super(props);

		this.operation = null;

		this.opCanvas = document.createElement("canvas");
		this.opCtx = this.opCanvas.getContext("2d");

		const { width, height } = props.documentCanvas;
		this.opCanvas.width = width;
		this.opCanvas.height = height;

		this.canvasRef = React.createRef();

		this.cache = {};
		// hashes of operations up to and including the given operation in the document
		this.hashInDocumentByOperation = new Map();
	}
	render() {
		const { width, height } = this.props.documentCanvas;
		if (this.animationFrameID) {
			cancelAnimationFrame(this.animationFrameID);
		}
		this.animationFrameID = requestAnimationFrame(this.draw.bind(this));
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
		const {
			documentCanvas,
			documentContext,
			operations,
			thumbnailsByOperation,
		} = this.props;
		const ctx = canvas.getContext("2d");

		documentContext.clearRect(0, 0, opCanvas.width, opCanvas.height);

		const runningHash = sha256();
		operations.forEach((operation, operationIndex) => {
			runningHash.update(JSON.stringify(operation));
			const operationHash = runningHash.digest("hex");
			opCtx.clearRect(0, 0, opCanvas.width, opCanvas.height);
			if (this.cache[operationHash]) {
				// console.log("cache hit");
				documentContext.drawImage(this.cache[operationHash], 0, 0);
			} else {
				// opCtx.clearRect(0, 0, opCanvas.width, opCanvas.height);
				// console.log("cache miss");
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
					tool.click(opCtx, startPos.x, startPos.y, swatch, documentContext);
				}

				documentContext.drawImage(opCanvas, 0, 0);

				this.hashInDocumentByOperation.set(operation, operationHash);

				// fill the cache
				if (!operation.updatingContinously) {
					this.cache[operationHash] = document.createElement("canvas");
					this.cache[operationHash].width = opCanvas.width;
					this.cache[operationHash].height = opCanvas.height;
					this.cache[operationHash].getContext("2d").drawImage(opCanvas, 0, 0);
				}

				// TODO: optimize: use existing canvas if it exists (clear and update it)
				const thumbnail = document.createElement("canvas");
				thumbnail.width = 64;
				thumbnail.height = 64;
				// TODO: keep thumbnail proportional
				// can reuse code in ToolPreview.js
				thumbnail.getContext("2d").drawImage(opCanvas, 0, 0, 64, 64);
				thumbnailsByOperation.set(operation, thumbnail);

				// invalidate the cache for any future operations
				// TODO: need to invalidate "redos"
				// // console.log("invalidate", operations, operationIndex + 1);
				// operations.slice(operationIndex + 1).forEach((operation)=> {
				// 	// TODO: unless self-contained
				// 	// console.log(thumbnailsByOperation.has(operation), thumbnailsByOperation);
				// 	thumbnailsByOperation.delete(operation);
				// 	delete this.cache[this.hashInDocumentByOperation.get(operation)];
				// });
			}
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
		delete this.operation.updatingContinously; // bit of a hack so let's uh clean it up / make it less present in the document store... (as opposed to setting it to false)
		updateOperation(this.operation);

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
		cancelAnimationFrame(this.animationFrameID);
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
