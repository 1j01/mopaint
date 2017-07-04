import React, {Component} from 'react';
import Paper from 'material-ui/Paper';
import Palette from './Palette.js';
import './Colorbox.css';

class Colorbox extends Component {
	render() {
		const {palette, selectedSwatch, selectSwatch} = this.props;
		return (
			<div className="Colorbox">
				<div className="Colorbox-selected-swatches">
					<Paper
						key={selectedSwatch}
						className="Colorbox-selected-swatch"
						style={{backgroundColor: selectedSwatch}}
						onClick={()=> {selectSwatch(selectedSwatch)}}
						label=" " // HACK to avoid warning
					/>
				</div>
				<div className="Colorbox-divider" />
				<Palette palette={palette} selectSwatch={selectSwatch} />
			</div>
		);
	}
}

export default Colorbox;
