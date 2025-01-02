import PropTypes from "prop-types";
import { Component } from "react";
import ToolPreview from "./ToolPreview.js";
import "./Toolbox.css";

class Toolbox extends Component {
	render() {
		var { tools, selectedTool, selectTool } = this.props;
		tools = tools || []; // TODO: loading state
		return (
			<div className="Toolbox" role="radiogroup">
				{tools.map((tool) => {
					const selected = selectedTool === tool;
					return (
						<button
							key={tool.name}
							className="Toolbox-tool"
							// TODO: disabled when selected?
							role="radio"
							aria-checked={selected ? "aria-checked" : null}
							onClick={() => {
								selectTool(tool);
							}}
							title={tool.name}
						>
							<ToolPreview tool={tool} width={48} height={48} />
						</button>
					);
				})}
			</div>
		);
	}
}

Toolbox.propTypes = {
	tools: PropTypes.array,
	selectedTool: PropTypes.object,
	selectTool: PropTypes.func.isRequired,
};

export default Toolbox;
