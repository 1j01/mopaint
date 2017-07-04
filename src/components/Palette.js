import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
// import Paper from 'material-ui/Paper';
import './Palette.css';

class Palette extends Component {
	render() {
		const {palette, selectedSwatch, selectSwatch} = this.props;
		return (
			<div className="Palette">
				{palette.map((swatch)=> {
					const selected = selectedSwatch === swatch;
					return <RaisedButton
						key={swatch}
						className={"Palette-swatch" + (selected ? " selected" : "")}
						// style={{backgroundColor: swatch}}
						backgroundColor={swatch}
						onClick={()=> {selectSwatch(swatch)}}
						label=" "
					></RaisedButton>;
					// return <Paper style={{
					// 	backgroundColor: swatch,
					// 	display: "inline-block",
					// 	width: 36, height: 36,
					// 	margin: 2
					// }}></Paper>;
				})}
			</div>
		);
	}
}

export default Palette;
