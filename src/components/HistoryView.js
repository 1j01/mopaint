import { List } from "immutable";
import React, { Component } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import HistoryEntry from "./HistoryEntry.js";
import "./HistoryView.css";

// TODO: DRY Toolbox + Palette + HistoryView maybe
// should refactor it so the list is separate from the history entry display!
// and support keyboard navigation! and scroll the view
class HistoryView extends Component {
	render() {
		const { undos, redos, goToEntry } = this.props;
		const allHistory = undos.concat(redos.reverse());
		// TODO: should have an entry for New Document
		// so you can click to before the first operation, like you can Ctrl+Z to it!
		return (
			<div className="HistoryView" role="radiogroup">
				{allHistory.map((entry, index) => {
					const selected = entry === undos.last();
					return (
						<HistoryEntry
							key={entry.id}
							entry={entry}
							selected={selected}
							onClick={() => goToEntry(entry)}
						/>
					);
				})}
			</div>
		);
	}
	componentDidUpdate() {
		// would onComponentDidMount for HistoryEntry be better? or.. or what?
		//scrollIntoView(HistoryEntry)
		const el = ReactDOM.findDOMNode(this);
		el.scrollTo(0, el.scrollHeight);
	}
}

HistoryView.propTypes = {
	undos: PropTypes.instanceOf(List).isRequired,
	redos: PropTypes.instanceOf(List).isRequired,
};

export default HistoryView;
