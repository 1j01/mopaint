import React from "react";
import "./DarkModeToggle.css";

export default function DarkModeToggle() {
	return <>
		<input className="dark-mode-checkbox" id="day-night-toggle" type="checkbox"/>
		<label className="dark-mode-button" htmlFor="day-night-toggle">
		<div className="rays">
			<div className="ray"></div>
			<div className="ray"></div>
			<div className="ray"></div>
			<div className="ray"></div>
			<div className="ray"></div>
			<div className="ray"></div>
			<div className="ray"></div>
			<div className="ray"></div>
		</div>
		<div className="sun-moon">
			<div className="shadow"></div>
		</div>
		</label>
		<div className="veil"></div>
	</>;
};

