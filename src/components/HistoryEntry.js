import React, { Component } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import ToolPreview from "./ToolPreview.js";
import "./HistoryEntry.css";
import HistoryNode from "../HistoryNode.js";

// const modulo = (a, b) => (+a % (b = +b) + b) % b;

function isScrolledIntoView(el) {
	// Partially visible elements return true.
	// Assumption: scroll pane is near window height (and scrolls vertically)
	const rect = el.getBoundingClientRect();
	return rect.top < window.innerHeight && rect.bottom >= 0;
}

class Thumbnail extends Component {
	render() {
		const { width, height } = this.props;
		this.maybeLoadingTime = 0;
		return <canvas width={width} height={height} />;
	}
	draw() {
		const { indexInListForAnimationOffset, image } = this.props;
		const canvas = ReactDOM.findDOMNode(this);

		if(!isScrolledIntoView(canvas)){
			return;
		}

		const ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	
		ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
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
	image: PropTypes.object.isRequired,
};

class HistoryEntry extends Component {
	shouldComponentUpdate(nextProps) {
		return (
			nextProps.current !== this.props.current ||
			nextProps.historyNode !== this.props.historyNode ||
			nextProps.ancestorOfCurrent !== this.props.ancestorOfCurrent ||
			nextProps.indexInListForAnimationOffset !== this.props.indexInListForAnimationOffset
		);
	}
	render() {
		const {
			current,
			ancestorOfCurrent,
			onClick,
			historyNode,
			indexInListForAnimationOffset,
			getThumbnailImageMaybe,
			getIconReactElementMaybe,
		} = this.props;
		const {operation} = historyNode;
		const thumbnailImage = getThumbnailImageMaybe();
		const thumbnail = thumbnailImage ? <Thumbnail
			width={24}
			height={24}
			indexInListForAnimationOffset={indexInListForAnimationOffset}
			image={thumbnailImage}
		/> : <div
			className="question-mark"
			style={{width: 24, height: 24}}
		/>;
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
				{thumbnail}
				{getIconReactElementMaybe?.() ?? (operation && <ToolPreview tool={operation.tool} width={16} height={16} />)}
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
