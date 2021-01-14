import React, { Component } from "react";
import PropTypes from "prop-types";
import HistoryEntry from "./HistoryEntry.js";
import LoadingIndicator from "./LoadingIndicator.js";
import "./HistoryView.css";
import {getHistoryAncestors, getAllHistoryNodesSortedByTimestamp} from "../history.js";
import HistoryNode from "../HistoryNode.js";
import { ReactComponent as NewDocumentIcon } from "../icons/small-n-flat/document-new-16px-importable.svg";
import { List } from "immutable";

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
		const entryComponent = this.currentEntryRef.current;
		const entryEl = entryComponent && entryComponent.entryRef.current;
		if (entryEl) {
			// @FIXME: can flicker or end up where the selected entry is offscreen
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
			nextProps.thumbnailsByOperation !== this.props.thumbnailsByOperation ||
			nextProps.loaded !== this.props.loaded
		);
	}
	render() {
		const { currentHistoryNode, goToHistoryNode, thumbnailsByOperation, loaded } = this.props;

		const historyAncestors = getHistoryAncestors(currentHistoryNode);
		const allHistoryNodes = getAllHistoryNodesSortedByTimestamp(currentHistoryNode);

		const navigate = (offset)=> {
			const startIndex = allHistoryNodes.indexOf(currentHistoryNode);
			const newIndex = startIndex + offset;
			const newHistoryNode = allHistoryNodes[newIndex];
			if (newHistoryNode) {
				goToHistoryNode(newHistoryNode);
			}
		};
		return (
			<div
				className="HistoryView"
				role="radiogroup"
				ref={this.selfRef}
				onKeyDown={(event)=> {
					if (event.key === "ArrowUp") {
						event.preventDefault();
						navigate(-1);
					} else if (event.key === "ArrowDown") {
						event.preventDefault();
						navigate(+1);
					}
					// TODO: PageUp, PageDown, Home, End?
					// how many of these thing should navigate the view vs the selection?
				}}
			>
				{loaded ? allHistoryNodes.map((node)=> {
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
				}) : <LoadingIndicator/>}
			</div>
		);
	}
}

HistoryView.propTypes = {
	currentHistoryNode: PropTypes.instanceOf(HistoryNode).isRequired,
	// TODO: https://www.npmjs.com/package/react-immutable-proptypes
	// undos: ImmutablePropTypes.listOf(PropTypes.instanceOf(HistoryNode)).isRequired,
	// redos: ImmutablePropTypes.listOf(PropTypes.instanceOf(HistoryNode)).isRequired,
	undos: PropTypes.instanceOf(List).isRequired,
	redos: PropTypes.instanceOf(List).isRequired,
	thumbnailsByOperation: PropTypes.instanceOf(Map).isRequired,
	goToHistoryNode: PropTypes.func.isRequired,
	loaded: PropTypes.bool.isRequired,
};

export default HistoryView;
