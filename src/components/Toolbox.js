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
						// overlayStyle={selected ? {backgroundColor: "rgba(0, 155, 255, 0.1)"} : {}}
						// disabled would be more meaningful, but doesn't look as good
						primary={selected}
						// disabled={selected}
						onClick={()=> {selectTool(tool)}}
						label={tool.name}
					></RaisedButton>;
				})}
			</div>
		);
	}
}

export default Toolbox;
