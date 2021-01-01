import React, { Component } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import HistoryEntry from "./HistoryEntry.js";
import "./HistoryView.css";
import {getHistoryAncestors, getAllHistoryNodesSortedByTimestamp} from "../history.js";
import HistoryNode from "../HistoryNode.js";
import { ReactComponent as NewDocumentIcon } from "../icons/small-n-flat/document-new-16px-importable.svg";

const blankImage = new Image();
// transparent single-pixel PNG
blankImage.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const questionMarkAnimationFrames = 100;
const questionMarkIconSize = 24;
function renderQuestionMarkAnimation() {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	const frames = questionMarkAnimationFrames;
	const frameWidth = questionMarkIconSize;
	const frameHeight = questionMarkIconSize;
	canvas.width = frameWidth * frames;
	canvas.height = frameHeight;
	for (let x = 0; x < canvas.width; x += frameWidth) {
		drawQuestionMark(ctx, frameHeight, x / canvas.width);
		ctx.translate(frameWidth, 0);
	}
	return canvas;
}
function drawQuestionMark(ctx, size, time) {
	const indexInListForAnimationOffset = 0; // TODO
	// ctx.fillRect(Math.random()*size / 2, Math.random()*size / 2, 10, 10);
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
		size / 2,
		size / 2,
		Math.min(size, size) / 2 * 0.9,
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
			// (Math.min(size, size) / 2 - 5) *
			((Math.min(size, size) / 2) *
				(2 +
					Math.sin(
						(i * Math.PI) / 2 +
							time * Math.PI * 2 -
							indexInListForAnimationOffset * 0.03
					))) /
			3;
		// ctx.lineWidth = 5 *
		// 	(1 + Math.sin(Math.PI/2 +
		// 		i * Math.PI/2 +
		// 		time * Math.PI * 2 +
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
						time * Math.PI * 2 -
						indexInListForAnimationOffset * 0.03
				)
			)})`;
		ctx.beginPath();
		ctx.arc(
			size / 2,
			size / 2,
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
	ctx.font = `${(Math.min(size, size) / 2) *
		0.9}px sans-serif`;
	ctx.fillText("?", size / 2, size / 2);
}

// TODO: keyboard navigation
class HistoryView extends Component {
	constructor(props) {
		super(props);

		this.currentEntryRef = React.createRef();
		this.selfRef = React.createRef();
	}
	componentDidMount() {
		this.scrollSelectedEntryIntoView();
		const spritesheetCanvas = renderQuestionMarkAnimation();
		const spritesheetURL = spritesheetCanvas.toDataURL();
		// console.log("spritesheetURL", spritesheetURL);
		// window.open(spritesheetURL, "testing");
		this.selfRef.current.style.setProperty("--question-mark-animation", `url("${spritesheetURL}")`);
		this.selfRef.current.style.setProperty("--question-mark-animation-frames", questionMarkAnimationFrames);
		this.selfRef.current.style.setProperty("--question-mark-icon-size", `${questionMarkIconSize}px`);
	}
	componentDidUpdate(prevProps) {
		if (this.props.undos.size !== prevProps.undos.size) {
			// NOTE: assuming entry sizes are equal
			this.scrollSelectedEntryIntoView();
		}
	}
	scrollSelectedEntryIntoView() {
		const entryEl = this.currentEntryRef.current && ReactDOM.findDOMNode(this.currentEntryRef.current);
		if (entryEl) {
			entryEl.scrollIntoView({
				behavior: "instant",
				block: "nearest",
				inline: "nearest",
			});
			// entryEl.parentElement.scrollTop =
			// 	Math.min(
			// 		entryEl.offsetTop,
			// 		Math.max(
			// 			entryEl.parentElement.scrollTop,
			// 			entryEl.offsetTop - entryEl.parentElement.clientHeight + entryEl.clientHeight
			// 		)
			// 	);
		}
	}
	shouldComponentUpdate(nextProps) {
		return (
			nextProps.currentHistoryNode !== this.props.currentHistoryNode ||
			nextProps.thumbnailsByOperation !== this.props.thumbnailsByOperation
		);
	}
	render() {
		const { currentHistoryNode, goToHistoryNode, thumbnailsByOperation } = this.props;

		const historyAncestors = getHistoryAncestors(currentHistoryNode);
		const allHistoryNodes = getAllHistoryNodesSortedByTimestamp(currentHistoryNode);

		return (
			<div className="HistoryView" role="radiogroup" ref={this.selfRef}>
				{allHistoryNodes.map((node)=> {
					const ancestorOfCurrent = historyAncestors.indexOf(node) > -1;
					const current = node === currentHistoryNode;
					return <HistoryEntry
						key={node.id}
						historyNode={node}
						current={current}
						ref={current && this.currentEntryRef}
						ancestorOfCurrent={ancestorOfCurrent}
						onClick={() => goToHistoryNode(node)}
						indexInListForAnimationOffset={0 /* TODO */}
						getThumbnailImageMaybe={() =>
							node.operation ?
								thumbnailsByOperation.get(node.operation) :
								blankImage
						}
						getIconReactElementMaybe={() =>
							node.name === "New Document" ? <NewDocumentIcon width={16} height={16}/> : null
						}
					/>;
				})}
			</div>
		);
	}
}

HistoryView.propTypes = {
	currentHistoryNode: PropTypes.instanceOf(HistoryNode).isRequired,
	thumbnailsByOperation: PropTypes.instanceOf(Map).isRequired,
	goToHistoryNode: PropTypes.func.isRequired,
};

export default HistoryView;
