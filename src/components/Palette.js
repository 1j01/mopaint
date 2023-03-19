import React, { Component } from "react";
import PropTypes from "prop-types";
import "./Palette.css";

// TODO: DRY Toolbox + Palette
class Palette extends Component {
	render() {
		const { palette, selectedSwatch, selectSwatch } = this.props;
		return (
			<div className="Palette" role="radiogroup">
				{palette.map((swatch) => {
					const selected = selectedSwatch === swatch;
					return (
						<button
							key={swatch}
							className="Palette-swatch swatch"
							style={{ backgroundColor: swatch }}
							role="radio"
							aria-checked={selected ? "aria-checked" : null}
							onClick={() => {
								selectSwatch(swatch);
							}}
						/>
					);
				})}
			</div>
		);
	}
}

Palette.propTypes = {
	palette: PropTypes.array.isRequired,
	selectedSwatch: PropTypes.oneOfType([
		// PropTypes.instanceOf(CanvasPattern),
		// PropTypes.instanceOf(CanvasGradient),
		PropTypes.string,
	]).isRequired,
	selectSwatch: PropTypes.func.isRequired,
};

export default Palette;
