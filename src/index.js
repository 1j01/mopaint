import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './components/App';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import injectTapEventPlugin from 'react-tap-event-plugin';
import registerServiceWorker from './registerServiceWorker';
import './simulate-gestures.js';
 
// Needed for onTouchTap used by Material UI
// https://stackoverflow.com/a/34015469/988941 
injectTapEventPlugin();

if (window.location.protocol === 'http:' && window.location.host.match(/editor|app|mopaint/)) {
	window.location.protocol = 'https:';
}

const goToDocument = (documentID)=> {
	window.location.hash = `document=${documentID}`;
};

const byteToHex = (byte)=> `0${byte.toString(16)}`.slice(-2);

const generateID = (length=40)=> {
	// length must be an even number (default: 40)
	let array = new Uint8Array(length / 2);
	crypto.getRandomValues(array);
	return [].map.call(array, byteToHex).join('');
};

const createNewDocument = (documentsRef, uid, callback)=> {
	let newDocumentID = generateID();
	let newDocumentRef = documentsRef.child(newDocumentID);
	
	newDocumentRef.child('owner_uid').set(uid, (err)=> {
		callback(err, newDocumentID);
	});
};

const render = ()=> {
	const container = document.getElementById('root');
	const documentID = (window.location.hash.match(/document=([\w\-./]*)/) || [null, 'default'])[1];
	ReactDOM.render(
		<MuiThemeProvider>
			<App
				key={documentID}
				documentID={documentID}
				goToDocument={goToDocument}
				createNewDocument={createNewDocument}
			/>
		</MuiThemeProvider>,
		container
	);
};

window.addEventListener('hashchange', render);
render();

registerServiceWorker();
