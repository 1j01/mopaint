import { List } from "immutable";
import React from "react";
import PropTypes from "prop-types";
import HistoryEntry from "./HistoryEntry.js";
import "./HistoryView.css";

// TODO: DRY Toolbox + Palette + HistoryView maybe
// should refactor it so the list is separate from the history entry display!
// and support keyboard navigation! and scroll the view
const HistoryView = (props) => {
	const { undos, redos, goToEntry } = props;
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
};

HistoryView.propTypes = {
	undos: PropTypes.instanceOf(List).isRequired,
	redos: PropTypes.instanceOf(List).isRequired,
};

export default HistoryView;
