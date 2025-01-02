import PropTypes from "prop-types";
import { Component } from "react";
import "./Colorbox.css";
import Palette from "./Palette.js";

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

Colorbox.propTypes = {
	palette: PropTypes.array.isRequired,
	selectedSwatch: PropTypes.oneOfType([
		// PropTypes.instanceOf(CanvasPattern),
		// PropTypes.instanceOf(CanvasGradient),
		PropTypes.string,
	]).isRequired,
	selectSwatch: PropTypes.func.isRequired,
};

export default Colorbox;
