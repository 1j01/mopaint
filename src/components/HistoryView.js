import { List } from "immutable";
import React, { Component } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import HistoryEntry from "./HistoryEntry.js";
import "./HistoryView.css";
import {getHistoryAncestors, goToHistoryNode} from "../history.js";
import HistoryNode from "../HistoryNode.js";

const getRoot = (historyNode)=> {
	while (historyNode.parentNode) {
		historyNode = historyNode.parentNode;
	}
	return historyNode;
};

// TODO: DRY Toolbox + Palette + HistoryView maybe
// should refactor it so the list is separate from the history entry display!
// and support keyboard navigation! and scroll the view
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
	}
	onComponentDidMount() {
		if (this.currentEntryRef.current) {
			// this.scrollableRef.current.scrollTop(this.previousScrollPosition);
			this.currentEntryRef.current.scrollIntoView({block: "nearest"});
		}
	}
	render() {
		this.drawFunctions = [];

		const { currentHistoryNode, thumbnailsByOperation } = this.props;

		const rootHistoryNode = getRoot(currentHistoryNode);
		console.log("rootHistoryNode", rootHistoryNode);

		let entries = [];

		const renderTreeFromNode = (node)=> {
			const historyAncestors = getHistoryAncestors(currentHistoryNode);
			const ancestorOfCurrent = historyAncestors.indexOf(node) > -1;
			const current = node === currentHistoryNode;
			const operation = node.operation;
			const entry =
				<HistoryEntry
					key={node.id}
					operation={operation}
					current={current}
					ref={current && this.currentEntryRef}
					ancestorOfCurrent={ancestorOfCurrent}
					onClick={() => goToHistoryNode(node)}
					indexInListForAnimationOffset={0 /* TODO */}
					drawFunctionsArrayToAddTo={this.drawFunctions}
					getThumbnailImageMaybe={() => thumbnailsByOperation.get(entry)}
				/>;
			entry.historyNode = node; // HACK
			for (const subNode of node.futures) {
				renderTreeFromNode(subNode);
			}
			entries.push(entry);
		};

		if (this.scrollableRef.current) {
			this.previousScrollPosition = this.scrollableRef.current.scrollTop;
		}

		renderTreeFromNode(rootHistoryNode);
		entries.sort(($a, $b)=> {
			// HACK
			if ($a.historyNode.timestamp < $b.historyNode.timestamp) {
				return -1;
			}
			if ($b.historyNode.timestamp < $a.historyNode.timestamp) {
				return +1;
			}
			return 0;
		});

		return (
			<div className="HistoryView" role="radiogroup" ref={this.scrollableRef}>
				{entries}
			</div>
		);
	}
}

HistoryView.propTypes = {
	currentHistoryNode: PropTypes.instanceOf(HistoryNode).isRequired,
};

export default HistoryView;
