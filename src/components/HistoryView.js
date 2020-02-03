import React, { Component } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import HistoryEntry from "./HistoryEntry.js";
import "./HistoryView.css";
import {getHistoryAncestors, getAllHistoryNodesSortedByTimestamp} from "../history.js";
import HistoryNode from "../HistoryNode.js";
import { ReactComponent as NewDocumentIcon } from "../icons/small-n-flat/document-new-importable.svg";

const blankImage = new Image();
// transparent single-pixel PNG
blankImage.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

// TODO: keyboard navigation
class HistoryView extends Component {
	constructor(props) {
		super(props);

		this.currentEntryRef = React.createRef();
		
		// TODO: cleanup how this works!
		this.drawFunctions = [];
	}
	componentDidMount() {
		const animate = () => {
			this.animationFrameID = requestAnimationFrame(animate);
			this.drawFunctions.forEach((fn) => fn());
		};
		animate();
		this.scrollSelectedEntryIntoView();
	}
	componentWillUnmount() {
		cancelAnimationFrame(this.animationFrameID);
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
	render() {
		this.drawFunctions = [];

		const { currentHistoryNode, goToHistoryNode, thumbnailsByOperation } = this.props;

		const historyAncestors = getHistoryAncestors(currentHistoryNode);
		const allHistoryNodes = getAllHistoryNodesSortedByTimestamp(currentHistoryNode);

		return (
			<div className="HistoryView" role="radiogroup">
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
						drawFunctionsArrayToAddTo={this.drawFunctions}
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
