import React, { Component } from "react";
import ReactDOM from "react-dom";
import PropTypes from "prop-types";
import ToolPreview from "./ToolPreview.js";
import "./HistoryEntry.css";

class Thumbnail extends Component {
	render() {
		return <canvas width={24} height={24} />;
	}
	componentDidMount() {
		var canvas = ReactDOM.findDOMNode(this);
		var ctx = canvas.getContext("2d");
		ctx.drawImage(this.props.image, 0, 0, 24, 24);
	}
}

const HistoryEntry = (props) => {
	const { selected, onClick, entry } = props;
	return (
		<button
			className="HistoryEntry"
			role="radio"
			aria-checked={selected ? "aria-checked" : null}
			onClick={onClick}
		>
			<Thumbnail image={entry.patchCanvas} />
			<ToolPreview tool={entry.tool} width={16} height={16} />
			{entry.name}
		</button>
	);
};

HistoryEntry.propTypes = {
	entry: PropTypes.object.isRequired,
	selected: PropTypes.bool.isRequired,
	onClick: PropTypes.func.isRequired,
};

export default HistoryEntry;
