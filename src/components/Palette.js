import React, {Component} from 'react';
import './Palette.css';

class Palette extends Component {
	render() {
		const {palette, selectedSwatch, selectSwatch} = this.props;
		return (
			<div className="Palette"
				role="radiogroup"
			>
				{palette.map((swatch)=> {
					const selected = selectedSwatch === swatch;
					return (
						<button
							key={swatch}
							className="Palette-swatch swatch"
							style={{backgroundColor: swatch}}
							role="radio"
							aria-checked={selected ? "aria-checked" : null}
							onClick={()=> { selectSwatch(swatch); }}
						/>
					);
				})}
			</div>
		);
	}
}

export default Palette;
