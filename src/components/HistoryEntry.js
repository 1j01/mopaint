import React, { Component } from "react";
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
	constructor(props) {
		super(props);
		this.canvasRef = React.createRef();
	}
	shouldComponentUpdate(newProps) {
		return (
			newProps.thumbnailsByOperation !== this.props.thumbnailsByOperation ||
			newProps.operation !== this.props.operation
		);
	}
	render() {
		const { thumbnailsByOperation, operation, width, height } = this.props;
		if (operation && !thumbnailsByOperation.get(operation)) {
			return <div
				className="question-mark"
				style={{ width, height }}
			/>;
		}
		return <canvas width={width} height={height} ref={this.canvasRef} />;
	}
	draw() {
		const { thumbnailsByOperation, operation } = this.props;
		if (!operation) {
			return;
		}

		const image = thumbnailsByOperation.get(operation);
		if (!image) {
			return;
		}

		const canvas = this.canvasRef.current;

		if (!isScrolledIntoView(canvas)) {
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
	thumbnailsByOperation: PropTypes.instanceOf(Map).isRequired,
	operation: PropTypes.object,
};

class HistoryEntry extends Component {
	constructor(props) {
		super(props);
		this.entryRef = React.createRef();
	}
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
			// thumbnailsByOperation,
			getIconReactElementMaybe,
		} = this.props;
		const { operation } = historyNode;
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
				ref={this.entryRef}
			>
				{/* <Thumbnail
					width={24}
					height={24}
					thumbnailsByOperation={thumbnailsByOperation}
					operation={operation}
				/> */}
				{getIconReactElementMaybe?.() ?? (operation && <ToolPreview tool={operation.tool} width={16} height={16} />)}
				{historyNode.name}
			</button>
		);
	}
}

HistoryEntry.propTypes = {
	historyNode: PropTypes.instanceOf(HistoryNode).isRequired,
	thumbnailsByOperation: PropTypes.instanceOf(Map).isRequired,
	getIconReactElementMaybe: PropTypes.func.isRequired,
	current: PropTypes.bool.isRequired,
	ancestorOfCurrent: PropTypes.bool.isRequired,
	onClick: PropTypes.func.isRequired,
};

export default HistoryEntry;
