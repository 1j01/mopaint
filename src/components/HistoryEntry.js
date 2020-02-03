import React, { Component } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import ToolPreview from "./ToolPreview.js";
import "./HistoryEntry.css";
import HistoryNode from "../HistoryNode.js";

// const modulo = (a, b) => (+a % (b = +b) + b) % b;

class Thumbnail extends Component {
	render() {
		const { width, height } = this.props;
		this.props.drawFunctionsArrayToAddTo.push(() => this.draw());
		this.maybeLoadingTime = 0;
		return <canvas width={width} height={height} />;
	}
	draw() {
		const { indexInListForAnimationOffset, getImageMaybe } = this.props;
		const canvas = ReactDOM.findDOMNode(this);
		const ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// TODO: clean up how this works!
		// this getImageMaybe thing is a hack to update the image outside of React's render model,
		// since we already have an animation loop
		const image = getImageMaybe();
		if (image) {
			ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
		} else {
			// ctx.fillRect(Math.random()*canvas.width / 2, Math.random()*canvas.height / 2, 10, 10);
			/*
			ctx.beginPath();
			const baseRotationTurns =
				Math.sin(
					performance.now() / 1000 +
					indexInListForAnimationOffset * 0.03
					// 0
				) * 5 / Math.pow(1.001, this.maybeLoadingTime++);
			const baseRotationRadians = modulo(baseRotationTurns * Math.PI * 2, Math.PI * 2);
			ctx.arc(
				canvas.width / 2,
				canvas.height / 2,
				Math.min(canvas.width, canvas.height) / 2 * 0.9,
				baseRotationRadians,
				baseRotationRadians + Math.PI / 2,
				false
			);
			ctx.lineWidth = 2;
			ctx.strokeStyle = "rgba(128, 128, 128, 0.8)";
			ctx.stroke();
			*/
			// ctx.save();
			for (let i = 0; i < 4; i += 1) {
				let radius =
					// (Math.min(canvas.width, canvas.height) / 2 - 5) *
					((Math.min(canvas.width, canvas.height) / 2) *
						(2 +
							Math.sin(
								(i * Math.PI) / 2 +
									performance.now() / 1000 -
									indexInListForAnimationOffset * 0.03
							))) /
					3;
				// ctx.lineWidth = 5 *
				// 	(1 + Math.sin(Math.PI/2 +
				// 		i * Math.PI/2 +
				// 		performance.now() / 1000 +
				// 		indexInListForAnimationOffset * 0.03
				// 	)) / 2;
				// radius += ctx.lineWidth / 2;
				// ctx.lineWidth = radius / 2;
				// radius += ctx.lineWidth / 2;

				// ctx.strokeStyle = "rgba(128, 128, 128, 0.8)";
				// ctx.fillStyle = "rgba(128, 128, 128, 0.8)";
				ctx.fillStyle = `rgba(128, 128, 128, ${0.8 *
					Math.max(
						0,
						Math.sin(
							Math.PI / 2 +
								(i * Math.PI) / 2 +
								performance.now() / 1000 -
								indexInListForAnimationOffset * 0.03
						)
					)})`;
				ctx.beginPath();
				ctx.arc(
					canvas.width / 2,
					canvas.height / 2,
					radius,
					0,
					Math.PI * 2,
					false
				);
				// ctx.stroke();
				ctx.fill();
			}
			// ctx.restore();
			ctx.fillStyle = "white";
			ctx.textBaseline = "middle";
			ctx.textAlign = "center";
			ctx.font = `${(Math.min(canvas.width, canvas.height) / 2) *
				0.9}px sans-serif`;
			ctx.fillText("?", canvas.width / 2, canvas.height / 2);
		}
	}
	componentDidMount() {
		this.draw();
	}
	componentDidUpdate() {
		this.draw();
	}
	// (TODO)
	// shouldComponentUpdate(newProps) {
	// 	return newProps.image !== this.props.image;
	// }
}

Thumbnail.propTypes = {
	width: PropTypes.number.isRequired,
	height: PropTypes.number.isRequired,
	indexInListForAnimationOffset: PropTypes.number.isRequired,
	getImageMaybe: PropTypes.func.isRequired,
};

class HistoryEntry extends Component {
	render() {
		const {
			current,
			ancestorOfCurrent,
			onClick,
			historyNode,
			indexInListForAnimationOffset,
			drawFunctionsArrayToAddTo,
			getThumbnailImageMaybe,
			getThumbnailReactElementMaybe,
		} = this.props;
		const {operation} = historyNode;
		// NOTE: role works together with role in HistoryView
		return (
			<button
				className={
					"HistoryEntry" +
					(current ? " current" : "") +
					(ancestorOfCurrent ? " ancestor-of-current" : "")
				}
				role="radio"
				aria-checked={current ? "aria-checked" : null}
				onClick={onClick} // for keyboard accessibility (?)
				onMouseDown={onClick} // for speed (w/ a mouse)
			>
				{getThumbnailReactElementMaybe?.() ??
					<Thumbnail
						width={24}
						height={24}
						indexInListForAnimationOffset={indexInListForAnimationOffset}
						drawFunctionsArrayToAddTo={drawFunctionsArrayToAddTo}
						getImageMaybe={getThumbnailImageMaybe}
					/>
				}
				{operation && <ToolPreview tool={operation.tool} width={16} height={16} />}
				{historyNode.name}
			</button>
		);
	}
}

HistoryEntry.propTypes = {
	historyNode: PropTypes.instanceOf(HistoryNode).isRequired,
	current: PropTypes.bool.isRequired,
	ancestorOfCurrent: PropTypes.bool.isRequired,
	onClick: PropTypes.func.isRequired,
};

export default HistoryEntry;
