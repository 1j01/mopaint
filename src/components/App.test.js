import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

if (global.crypto) {
	console.trace("global.crypto already exists; this code can be removed");
} else {
	var nodeCrypto = require('crypto');
	global.crypto = {
		getRandomValues: function (buffer) { return nodeCrypto.randomFillSync(buffer); }
	};
}

/* global it:false */
it("renders without crashing", () => {
	const div = document.createElement("div");
	ReactDOM.render(<App
		documentID={"test-document-id"}
		goToDocument={() => { throw new Error("goToDocument not expected in this test"); }}
		createNewDocument={() => { throw new Error("createNewDocument not expected in this test"); }}
		loadNewDocument={() => { throw new Error("loadNewDocument not expected in this test"); }}
		serializedDocumentToLoad={null}
	/>, div);
});
