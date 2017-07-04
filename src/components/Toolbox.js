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
					return (
						<RaisedButton
							key={tool.name}
							className="Toolbox-tool"
							// disabled would be more meaningful, but it doesn't transition well
							// TODO: disabled and/or aria-pressed
							primary={selected}
							onClick={()=> {selectTool(tool)}}
							label={tool.name}
						/>
					);
				})}
			</div>
		);
	}
}

export default Toolbox;
