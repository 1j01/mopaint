import React, { Component } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import ToolPreview from "./ToolPreview.js";
import "./HistoryEntry.css";

class Thumbnail extends Component {
	render() {
		const { width, height } = this.props;
		return <canvas width={width} height={height} />;
	}
	draw() {
		var canvas = ReactDOM.findDOMNode(this);
		var ctx = canvas.getContext("2d");
		ctx.drawImage(this.props.image, 0, 0, canvas.width, canvas.height);
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
		const { selected, onClick, entry } = this.props;
		// TODO: always show thumbnail, have loading state (or other indicator) if not available
		return (
			<button
				className="HistoryEntry"
				role="radio"
				aria-checked={selected ? "aria-checked" : null}
				onClick={onClick}
			>
				{entry.thumbnail && (
					<Thumbnail image={entry.thumbnail} width={24} height={24} />
				)}
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
		var el = ReactDOM.findDOMNode(this);
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
