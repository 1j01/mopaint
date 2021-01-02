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
	shouldComponentUpdate(newProps) {
		return newProps.image !== this.props.image;
	}
	render() {
		const { image, width, height } = this.props;
		this.maybeLoadingTime = 0;
		if (!image) {
			return <div
				className="question-mark"
				style={{width, height}}
			/>;
		}
		return <canvas width={width} height={height} />;
	}
	draw() {
		const { image } = this.props;

		if (!image) {
			return;
		}

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
}

Thumbnail.propTypes = {
	width: PropTypes.number.isRequired,
	height: PropTypes.number.isRequired,
	image: PropTypes.object,
};

class HistoryEntry extends Component {
	shouldComponentUpdate(nextProps) {
		return (
			nextProps.current !== this.props.current ||
			nextProps.historyNode !== this.props.historyNode ||
			nextProps.ancestorOfCurrent !== this.props.ancestorOfCurrent
		);
	}
	render() {
		const {
			current,
			ancestorOfCurrent,
			onClick,
			historyNode,
			getThumbnailImageMaybe,
			getIconReactElementMaybe,
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
				<Thumbnail
					width={24}
					height={24}
					image={getThumbnailImageMaybe()}
				/>
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
