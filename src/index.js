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

/*
const goToDocument = (documentID) => {
	window.location.hash = `document=${documentID}`;
};

// TODO: more URL-friendly/efficient IDs
const byteToHex = (byte) => `0${byte.toString(16)}`.slice(-2);
const generateID = (length = 40) => {
	// length must be an even number (default: 40)
	const array = new Uint8Array(length / 2);
	crypto.getRandomValues(array);
	return Array.from(array, byteToHex).join("");
};

const createNewDocument = (documentsRef, uid, callback) => {
	let newDocumentID = generateID();
	let newDocumentRef = documentsRef.child(newDocumentID);

	newDocumentRef.child("owner_uid").set(uid, (err) => {
		callback(err, newDocumentID);
	});
};
*/

const render = () => {
	const container = document.getElementById("root");
	// const documentID = (window.location.hash.match(/document=([\w\-./]*)/) || [
	// 	null,
	// 	"default",
	// ])[1];
	ReactDOM.render(
		<App
		// key={documentID}
		// documentID={documentID}
		// goToDocument={goToDocument}
		// createNewDocument={createNewDocument}
		/>,
		container
	);
};

window.addEventListener("hashchange", render);
render();

registerServiceWorker();
