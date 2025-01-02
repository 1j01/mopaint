import React from "react";
import ReactDOMClient from "react-dom/client";
import App from "./App.js";

if (global.crypto) {
	console.trace("global.crypto already exists; this code can be removed");
} else {
	var nodeCrypto = require("crypto");
	global.crypto = {
		getRandomValues: function (buffer) { return nodeCrypto.randomFillSync(buffer); },
	};
}

it("renders without crashing", () => {
	const div = document.createElement("div");
	const root = ReactDOMClient.createRoot(div);
	root.render(<App
		documentID={"test-document-id"}
		goToDocument={() => { throw new Error("goToDocument not expected in this test"); }}
		createNewDocument={() => { throw new Error("createNewDocument not expected in this test"); }}
		loadNewDocument={() => { throw new Error("loadNewDocument not expected in this test"); }}
		serializedDocumentToLoad={null}
	/>);
});
