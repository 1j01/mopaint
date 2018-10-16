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
};

const createNewDocument = () => {
	const newDocumentID = shortid.generate();
	goToDocument(newDocumentID);
};

const render = () => {
	const container = document.getElementById("root");
	const documentID = getIDfromCurrentURL();
	// TODO: don't allow implicit default document stored as "undefined"
	// create a new document, but use history.replaceState()
	// (could also check if it's a 'valid' id with shortid.isValid(documentID))
	// (but i might switch to a different id generator anyways, idk)
	ReactDOM.render(
		<App
			key={documentID}
			documentID={documentID}
			// goToDocument={goToDocument}
			createNewDocument={createNewDocument}
		/>,
		container
	);
};

window.addEventListener("popstate", render);
render();

registerServiceWorker();
