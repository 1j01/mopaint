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
const getIDFromCurrentURL = () =>
	(window.location.search.match(/document=([\w\-./]*)/) || [])[1];

const goToDocument = (documentID) => {
	window.history.pushState({}, null, urlForID(documentID));
	render();
};

const createNewDocument = () => {
	const newDocumentID = shortid.generate();
	goToDocument(newDocumentID);
};

let toLoad = {
	serializedDocument: null,
	documentID: null,
};
const loadNewDocument = (serializedDocument) => {
	const documentID = shortid.generate();
	toLoad = {serializedDocument, documentID};
	console.log(`Start new document (${documentID}) from`, serializedDocument);
	goToDocument(documentID);
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

const render = () => {
	const container = document.getElementById("root");
	const documentID = getIDFromCurrentURL();
	if (!documentID) {
		createNewDocument();
		return;
	}
	let serializedDocumentToLoad;
	if (documentID === toLoad.documentID) {
		serializedDocumentToLoad = toLoad.serializedDocument;
		toLoad = {
			serializedDocument: null,
			documentID: null,
		};
	}
	ReactDOM.render(
		<App
			key={documentID}
			documentID={documentID}
			documentIDs={documentIDs}
			goToDocument={goToDocument}
			createNewDocument={createNewDocument}
			loadNewDocument={loadNewDocument}
			serializedDocumentToLoad={serializedDocumentToLoad}
		/>,
		container
	);
};

window.addEventListener("popstate", render);
render();
updateDocumentsList();
setInterval(updateDocumentsList, 600);

registerServiceWorker();
