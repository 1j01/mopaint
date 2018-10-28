import shortid from "shortid";
import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./components/App";
import registerServiceWorker from "./registerServiceWorker";
import "./simulate-gestures.js";

if (
	window.location.protocol === "http:" &&
	window.location.host.match(/editor|app|mopaint/)
) {
	window.location.protocol = "https:";
}

const urlForID = (documentID) =>
	`${window.location.origin}${window.location.pathname}?document=${documentID}`;
const getIDfromCurrentURL = () =>
	(window.location.search.match(/document=([\w\-./]*)/) || [])[1];

const goToDocument = (documentID) => {
	window.history.pushState({}, null, urlForID(documentID));
	render();
};

const createNewDocument = () => {
	const newDocumentID = shortid.generate();
	goToDocument(newDocumentID);
};

const render = () => {
	const container = document.getElementById("root");
	const documentID = getIDfromCurrentURL();
	if (!documentID) {
		createNewDocument();
		return;
	}
	ReactDOM.render(
		<App
			key={documentID}
			documentID={documentID}
			goToDocument={goToDocument}
			createNewDocument={createNewDocument}
		/>,
		container
	);
};

window.addEventListener("popstate", render);
render();

registerServiceWorker();
