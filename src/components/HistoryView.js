import React, { Component } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import HistoryEntry from "./HistoryEntry.js";
import "./HistoryView.css";
import {getHistoryAncestors, getAllHistoryNodesSortedByTimestamp} from "../history.js";
import HistoryNode from "../HistoryNode.js";
import { ReactComponent as NewDocumentIcon } from "../icons/small-n-flat/document-new-16px-importable.svg";

// TODO: keyboard navigation
class HistoryView extends Component {
	constructor(props) {
		super(props);

		this.currentEntryRef = React.createRef();
		this.selfRef = React.createRef();
	}
	componentDidMount() {
		this.scrollSelectedEntryIntoView();
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
						thumbnailsByOperation={thumbnailsByOperation}
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
