import React, { Component } from "react";
import Palette from "./Palette.js";
import "./Colorbox.css";

class Colorbox extends Component {
	render() {
		const { palette, selectedSwatch, selectSwatch } = this.props;
		return (
			<div className="Colorbox">
				<div className="Colorbox-selected-swatches">
					<div
						className="Colorbox-selected-swatch swatch"
						key={selectedSwatch}
						style={{ backgroundColor: selectedSwatch }}
					/>
				</div>
				<div className="Colorbox-divider" />
				<Palette
					palette={palette}
					selectedSwatch={selectedSwatch}
					selectSwatch={selectSwatch}
				/>
			</div>
		);
	}
}

export default Colorbox;
