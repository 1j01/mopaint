import React, { Component } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import trimCanvas from "../trim-canvas.js";
// import './ToolPreview.css';

class ToolPreview extends Component {
	render() {
		const { width, height, tool } = this.props;
		if (tool.Icon) {
			return (
				<tool.Icon className="ToolPreview" width={width} height={height} />
			);
		} else {
			return (
				<canvas
					className="ToolPreview"
					width={width}
					height={height}
					ref="canvas"
				/>
			);
		}
	}
	componentDidMount() {
		const canvas = ReactDOM.findDOMNode(this.refs.canvas);
		if (!canvas) {
			return;
		}
		const ctx = canvas.getContext("2d");

		const opCanvas = document.createElement("canvas");
		opCanvas.width = 128;
		opCanvas.height = 128;
		const opContext = opCanvas.getContext("2d");

		const { tool } = this.props;

		const swatch = "black";

		const points = tool.getDemoPointsForIcon(opCanvas.width, opCanvas.height);

		tool.drawFromPoints(opContext, points, swatch);

		const trimmedCanvas = trimCanvas(opCanvas);

		let drawWidth, drawHeight;
		// TODO: maybe handle height not equaling width for props to ToolPreview
		if (trimmedCanvas.width > trimmedCanvas.height) {
			drawWidth = canvas.width;
			drawHeight = (trimmedCanvas.height / trimmedCanvas.width) * canvas.width;
		} else {
			drawWidth = (trimmedCanvas.width / trimmedCanvas.height) * canvas.width;
			drawHeight = canvas.width;
		}
		ctx.drawImage(
			trimmedCanvas,
			(canvas.width - drawWidth) / 2,
			(canvas.height - drawHeight) / 2,
			drawWidth,
			drawHeight
		);
	}
}

ToolPreview.propTypes = {
	tool: PropTypes.object.isRequired,
	width: PropTypes.number.isRequired,
	height: PropTypes.number.isRequired,
};

export default ToolPreview;
