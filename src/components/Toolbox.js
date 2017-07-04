import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import './Toolbox.css';

class Toolbox extends Component {
	render() {
		const {tools, selectedTool, selectTool} = this.props;
		return (
			<div className="Toolbox">
				{tools.map((tool)=> {
					const selected = selectedTool === tool;
					return <RaisedButton
						key={tool.name}
						className={"Toolbox-tool" + (selected ? " selected" : "")}
						// disabled would be more meaningful, but it doesn't transition well
						primary={selected}
						onClick={()=> {selectTool(tool)}}
						label={tool.name}
					></RaisedButton>;
				})}
			</div>
		);
	}
}

export default Toolbox;
