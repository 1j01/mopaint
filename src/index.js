import localforage from "localforage";
import { nanoid } from "nanoid";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App.js";
import "./index.css";
import registerServiceWorker from "./registerServiceWorker.js";
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
	const newDocumentID = nanoid(9);
	goToDocument(newDocumentID);
};

let toLoad = {
	serializedDocument: null,
	documentID: null,
};
const loadNewDocument = (serializedDocument, fileName) => {
	const documentID = nanoid(9);
	toLoad = { serializedDocument, documentID };
	console.log(`Start new document (${documentID}) from`, serializedDocument);
	localforage.setItem(`document:${documentID}:name`, fileName.replace(/(\.mop|\.mopaint)?(\.png)?$/i, ""), (/*error*/) => {
		// ignoring error
		goToDocument(documentID);
	});
};

const container = document.getElementById("root");
const root = createRoot(container);
const render = () => {
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
	root.render(
		<App
			key={documentID}
			documentID={documentID}
			goToDocument={goToDocument}
			createNewDocument={createNewDocument}
			loadNewDocument={loadNewDocument}
			serializedDocumentToLoad={serializedDocumentToLoad}
		/>
	);
};

window.addEventListener("popstate", render);
render();

registerServiceWorker();
