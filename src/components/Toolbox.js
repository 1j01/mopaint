import React, { Component } from 'react';
import './Toolbox.css';

class Toolbox extends Component {
	render() {
		const {tools, selectedTool, selectTool} = this.props;
		return (
			<div className="Toolbox">
				{tools.map((tool)=> {
					const selected = selectedTool === tool;
					return <button
						key={tool.name}
						className={"Toolbox-tool" + (selected ? " selected" : "")}
						onClick={()=> {selectTool(tool)}}
					>{tool.name}</button>;
				})}
			</div>
		);
	}
}

export default Toolbox;
