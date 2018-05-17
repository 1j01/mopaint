import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import trimCanvas from '../trim-canvas.js';
// import './ToolPreview.css';

class ToolPreview extends Component {
	render() {
		const { width, height } = this.props;
		return (
			<canvas
				className="ToolPreview"
				width={width}
				height={height}
				ref="canvas"
			/>
		);
	}
	componentDidMount() {
		const canvas = ReactDOM.findDOMNode(this.refs.canvas);
		const ctx = canvas.getContext("2d");

		const opCanvas = document.createElement("canvas");
		opCanvas.width = 128;
		opCanvas.height = 128;
		const opCtx = opCanvas.getContext("2d");

		const { tool } = this.props;

		const swatch = "black";

		// TODO: update how tools work so this isn't necessary
		// also, tools could maybe define some metadata of operation geometry for the preview
		if (tool.drawShape) {
			const startPos = { x: opCanvas.width / 2, y: opCanvas.height / 2 };
			const pos = { x: opCanvas.width - 20, y: opCanvas.height - 20 };
			tool.drawShape(opCtx, startPos.x, startPos.y, pos.x, pos.y, swatch, canvas.width, canvas.height);
		}
		if (tool.drawSegmentOfPath) {
			// TODO: smoothing (instead of just segments)

			// (not very constant, but the references are const)
			const lastPos = { x: 2, y: 2 };
			const pos = { x: 2, y: 2 };
			for (let i = 0; i < 20; i += 2) {
				pos.x = opCanvas.width / 2 + 48 * Math.sin(Math.sin(i * i / 302));
				pos.y = opCanvas.height / 2 + 48 * Math.cos(Math.sin(i / 5));
				if (i > 0) {
					tool.drawSegmentOfPath(opCtx, lastPos.x, lastPos.y, pos.x, pos.y, swatch, canvas.width, canvas.height);
				}
				lastPos.x = pos.x;
				lastPos.y = pos.y;
			}
		}
		if (tool.click) {
			// TODO: represent fill tool better, and/or at LEAST different from the rectangle tool
			tool.click(opCtx, opCanvas.width / 2, opCanvas.height / 2, swatch, ctx);
		}

		const trimmedCanvas = trimCanvas(opCanvas);


		let drawWidth, drawHeight;
		// TODO: maybe handle height not equaling width for props to ToolPreview
		if (trimmedCanvas.width > trimmedCanvas.height) {
			drawWidth = canvas.width;
			drawHeight = trimmedCanvas.height / trimmedCanvas.width * canvas.width;
		} else {
			drawWidth = trimmedCanvas.width / trimmedCanvas.height * canvas.width;
			drawHeight = canvas.width;
		}
		ctx.drawImage(
			trimmedCanvas,
			(canvas.width - drawWidth) / 2,
			(canvas.height - drawHeight) / 2,
			drawWidth,
			drawHeight,
		);
	}
}

export default ToolPreview;
