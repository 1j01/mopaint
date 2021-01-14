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
	if (window.location.search.match(/^\?./)) {
		window.history.pushState({}, null, urlForID(documentID));
	} else {
		// avoid trapping/breaking the back button, when the app is navigated to from another page
		window.history.replaceState({}, null, urlForID(documentID));
	}
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
const loadNewDocument = (serializedDocument, fileName) => {
	const documentID = shortid.generate();
	toLoad = { serializedDocument, documentID };
	console.log(`Start new document (${documentID}) from`, serializedDocument);
	localforage.setItem(`document:${documentID}:name`, fileName.replace(/(\.mop(aint))?(\.png)?$/i, ""), (/*error*/) => {
		// ignoring error
		goToDocument(documentID);
	});
};

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

registerServiceWorker();
