import { useLayoutEffect } from "react";
import "./DarkModeToggle.css";

function detectColorScheme() {
	// local storage is used to override OS theme settings
	// Note: local storage access can always fail due to privacy settings
	try {
		if (localStorage["mopaint-color-scheme"] === "dark") {
			return "dark";
		}
		if (localStorage["mopaint-color-scheme"] === "light") {
			return "light";
		}
		// eslint-disable-next-line no-empty
	} catch (error) { }

	// TODO: listen for change to setting? also what if you want to reset it to just using the system setting? is that a concern?
	// window.matchMedia("(prefers-color-scheme: dark)").onchange = (event)=> console.log(event, event.target.matches);
	if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
		// OS theme setting detected as dark
		return "dark";
	}
	// default to light theme
	return "light";
}

export default function DarkModeToggle() {

	// useLayoutEffect rather than useEffect avoids transition from light to dark on page load with dark preference set
	useLayoutEffect(() => {
		document.documentElement.setAttribute("data-color-scheme", detectColorScheme());
	});

	return <button
		className="dark-mode-button"
		aria-label="Toggle Dark Mode"
		onClick={() => {
			localStorage["mopaint-color-scheme"] = detectColorScheme() === "light" ? "dark" : "light";
			document.documentElement.setAttribute("data-color-scheme", detectColorScheme());
		}}
	>
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
	</button>;
}

