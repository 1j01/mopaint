import React, {Component} from 'react';
import './Toolbox.css';

class Toolbox extends Component {
	render() {
		const {tools, selectedTool, selectTool} = this.props;
		return (
			<div className="Toolbox" role="radiogroup">
				{tools.map((tool)=> {
					const selected = selectedTool === tool;
					return (
						<button
							key={tool.name}
							className="Toolbox-tool"
							// disabled would be more meaningful, but it doesn't transition well
							// TODO: disabled when selected?
							role="radio"
							aria-checked={selected ? "aria-checked" : null}
							onClick={()=> { selectTool(tool); }}
							// title={tool.name}
						>
							{tool.name}
						</button>
					);
				})}
			</div>
		);
	}
}

export default Toolbox;
