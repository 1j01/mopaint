import localforage from "localforage";
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

let documentIDs = []; // TODO: null, and loading indicators anywhere this state is used
const updateDocumentsList = () =>
	localforage.keys().then((keys) => {
		documentIDs = keys
			.map((key) => key.match(/document:([a-zA-Z0-9\-_]+):state/))
			.filter((key) => key)
			.map((key) => key[1]);
		render();
	});

const saveDocument = (serializedDocument) => {
	const blob = new File([JSON.stringify(serializedDocument)], "Drawing.mop", {
		type: "application/x-mopaint",
	});
	const a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = "Drawing.mop";
	a.click();
};

const openDocument = () => {};

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
			documentIDs={documentIDs}
			goToDocument={goToDocument}
			createNewDocument={createNewDocument}
			saveDocument={saveDocument}
			openDocument={openDocument}
		/>,
		container
	);
};

window.addEventListener("popstate", render);
render();
updateDocumentsList();
setInterval(updateDocumentsList, 600);

registerServiceWorker();
