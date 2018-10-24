import { List } from "immutable";
import React, { Component } from "react";
import PropTypes from "prop-types";
import HistoryEntry from "./HistoryEntry.js";
import "./HistoryView.css";

// TODO: DRY Toolbox + Palette + HistoryView maybe
// should refactor it so the list is separate from the history entry display!
// and support keyboard navigation! and scroll the view
class HistoryView extends Component {
	constructor(props) {
		super();
		// TODO: cleanup how this works!
		this.drawFunctions = [];
	}
	componentDidMount() {
		const animate = () => {
			this.animationFrameID = requestAnimationFrame(animate);
			this.drawFunctions.forEach((fn) => fn());
		};
		animate();
	}
	componentWillUnmount() {
		cancelAnimationFrame(this.animationFrameID);
	}
	render() {
		this.drawFunctions = [];
		// TODO: should have an entry for New Document
		// so you can click to before the first operation, like you can Ctrl+Z to it!
		const { undos, redos, goToEntry } = this.props;
		const allHistory = undos.concat(redos.reverse());
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
							indexInListForAnimationOffset={index}
							drawFunctionsArrayToAddTo={this.drawFunctions}
						/>
					);
				})}
			</div>
		);
	}
}

HistoryView.propTypes = {
	undos: PropTypes.instanceOf(List).isRequired,
	redos: PropTypes.instanceOf(List).isRequired,
};

export default HistoryView;
