import { List } from "immutable";
import React, { Component } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import HistoryEntry from "./HistoryEntry.js";
import "./HistoryView.css";
import {getHistoryAncestors} from "../history.js";

// TODO: DRY Toolbox + Palette + HistoryView maybe
// should refactor it so the list is separate from the history entry display!
// and support keyboard navigation! and scroll the view
class HistoryView extends Component {
	constructor(props) {
		super(props);

		this.scrollableRef = React.createRef();
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
		// TODO: should have an entry for New Document
		// so you can click to before the first operation, like you can Ctrl+Z to it!
		// <HistoryEntry
		// 	key="new-document-initial-entry"
		// 	entry={null}
		// 	selected={undos.size() === 0}
		// 	onClick={() => goToEntry(null)?}
		// 	indexInListForAnimationOffset={-1}
		// 	drawFunctionsArrayToAddTo={this.drawFunctions}
		// />
		const { undos, redos, goToEntry, thumbnailsByOperation } = this.props;
		const allHistory = undos.concat(redos.reverse());

		let entries = [];

		function renderTreeFromNode(node) {
			const historyAncestors = getHistoryAncestors(currentHistoryNode);
			const ancestorOfCurrent = historyAncestors.indexOf(node) > -1;
			const current = node === currentHistoryNode;
			const entry =
				<HistoryEntry
					key={entry.id}
					entry={entry}
					current={current}
					ref={current && this.currentEntryRef}
					ancestorOfCurrent={ancestorOfCurrent}
					onClick={() => goToEntry(entry)}
					indexInListForAnimationOffset={index}
					drawFunctionsArrayToAddTo={this.drawFunctions}
					getThumbnailImageMaybe={() => thumbnailsByOperation.get(entry)}
				/>;
			entry.historyNode = node; // HACK
			for (const subNode of node.futures) {
				renderTreeFromNode(subNode);
			}
			$entry.on("click", ()=> {
				goToHistoryNode(node);
			});
			$entry.historyNode = node;
			entries.push(entry);
		}

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
	undos: PropTypes.instanceOf(List).isRequired,
	redos: PropTypes.instanceOf(List).isRequired,
	// currentHistoryNode: PropTypes.instanceOf(HistoryNode).isRequired,
};

export default HistoryView;
