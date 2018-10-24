import React, { Component } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import ToolPreview from "./ToolPreview.js";
import "./HistoryEntry.css";

// const modulo = (a, b) => (+a % (b = +b) + b) % b;

class Thumbnail extends Component {
	render() {
		const { width, height } = this.props;
		this.props.drawFunctionsArrayToAddTo.push(() => this.draw());
		this.maybeLoadingTime = 0;
		return <canvas width={width} height={height} />;
	}
	draw() {
		const { indexInListForAnimationOffset } = this.props;
		const canvas = ReactDOM.findDOMNode(this);
		const ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		if (this.props.image) {
			ctx.drawImage(this.props.image, 0, 0, canvas.width, canvas.height);
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

class HistoryEntry extends Component {
	render() {
		const {
			selected,
			onClick,
			entry,
			indexInListForAnimationOffset,
			drawFunctionsArrayToAddTo,
		} = this.props;
		return (
			<button
				className="HistoryEntry"
				role="radio"
				aria-checked={selected ? "aria-checked" : null}
				onClick={onClick}
			>
				<Thumbnail
					image={entry.thumbnail}
					width={24}
					height={24}
					indexInListForAnimationOffset={indexInListForAnimationOffset}
					drawFunctionsArrayToAddTo={drawFunctionsArrayToAddTo}
				/>
				<ToolPreview tool={entry.tool} width={16} height={16} />
				{entry.tool.name}
			</button>
		);
	}
	// TODO: move scrolling logic outside of HistoryEntry
	componentDidMount() {
		this.scrollIntoView();
	}
	componentDidUpdate() {
		if (this.props.selected) {
			this.scrollIntoView();
		}
	}
	scrollIntoView() {
		const el = ReactDOM.findDOMNode(this);
		el.scrollIntoView({
			behavior: "instant",
			block: "nearest",
			inline: "nearest",
		});
		// This would work for old browser compatibility:
		// el.parentElement.scrollTop =
		// 	Math.min(
		// 		el.offsetTop,
		// 		Math.max(
		// 			el.parentElement.scrollTop,
		// 			el.offsetTop - el.parentElement.clientHeight + el.clientHeight
		// 		)
		// 	);
	}
}

HistoryEntry.propTypes = {
	entry: PropTypes.object.isRequired,
	selected: PropTypes.bool.isRequired,
	onClick: PropTypes.func.isRequired,
};

export default HistoryEntry;
