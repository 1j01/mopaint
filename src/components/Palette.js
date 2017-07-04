import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import './Palette.css';

class Palette extends Component {
	render() {
		const {palette, selectedSwatch, selectSwatch} = this.props;
		return (
			<div className="Palette">
				{palette.map((swatch)=> {
					const selected = selectedSwatch === swatch;
					// TODO: try to remove hover style and ripple effect to keep the color clear?
					return (
						<RaisedButton
							key={swatch}
							className={"Palette-swatch" + (selected ? " selected" : "")}
							backgroundColor={swatch}
							onClick={()=> {selectSwatch(swatch)}}
							label=" " // HACK to avoid warning
						/>
					);
				})}
			</div>
		);
	}
}

export default Palette;
