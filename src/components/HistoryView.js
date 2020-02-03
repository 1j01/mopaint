import React, { Component } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import HistoryEntry from "./HistoryEntry.js";
import "./HistoryView.css";
import {getHistoryAncestors, getAllHistoryNodesSortedByTimestamp} from "../history.js";
import HistoryNode from "../HistoryNode.js";
import { ReactComponent as NewDocumentIcon } from "../icons/small-n-flat/document-new-importable.svg";

// TODO: keyboard navigation
class HistoryView extends Component {
	constructor(props) {
		super(props);

		this.scrollableRef = React.createRef();
		this.currentEntryRef = React.createRef();
		
		this.previousScrollPosition = 0;

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
		const thisEl = ReactDOM.findDOMNode(this);
		const entryEl = thisEl.querySelector(
			".HistoryEntry[aria-checked=aria-checked]"
		);
		if (entryEl) {
			entryEl.scrollIntoView({
				behavior: "instant",
				block: "nearest",
				inline: "nearest",
			});
			// This would work for old browser compatibility:
			// entryEl.parentElement.scrollTop =
			// 	Math.min(
			// 		entryEl.offsetTop,
			// 		Math.max(
			// 			entryEl.parentElement.scrollTop,
			// 			entryEl.offsetTop - entryEl.parentElement.clientHeight + entryEl.clientHeight
			// 		)
			// 	);
		}
		// TODO:
		// if (this.currentEntryRef.current) {
		// 	// this.scrollableRef.current.scrollTop(this.previousScrollPosition);
		// 	this.currentEntryRef.current.scrollIntoView({block: "nearest"});
		// }
	}
	render() {
		this.drawFunctions = [];

		const { currentHistoryNode, goToHistoryNode, thumbnailsByOperation } = this.props;

		const historyAncestors = getHistoryAncestors(currentHistoryNode);
		const allHistoryNodes = getAllHistoryNodesSortedByTimestamp(currentHistoryNode);

		if (this.scrollableRef.current) {
			this.previousScrollPosition = this.scrollableRef.current.scrollTop;
		}

		return (
			<div className="HistoryView" role="radiogroup" ref={this.scrollableRef}>
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
							node.operation && thumbnailsByOperation.get(node.operation)
						}
						getThumbnailReactElementMaybe={() =>
							node.name === "New Document" && <NewDocumentIcon width={16} height={16}/>
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
