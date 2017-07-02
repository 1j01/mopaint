import React, { Component } from 'react';
import './Palette.css';

class Palette extends Component {
	render() {
		const {palette, selectedSwatch, selectSwatch} = this.props;
		return (
			<div className="Palette">
				{palette.map((swatch)=> {
					const selected = selectedSwatch === swatch;
					return <button
						key={swatch}
						className={"Palette-swatch" + (selected ? " selected" : "")}
						style={{backgroundColor: swatch}}
						onClick={()=> {selectSwatch(swatch)}}
					></button>;
				})}
			</div>
		);
	}
}

export default Palette;
