import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './components/App';
import registerServiceWorker from './registerServiceWorker';

if (window.location.protocol === 'http:' && window.location.host.match(/editor|app|mopaint/)) {
	window.location.protocol = 'https:';
}

const goToDocument = (documentID)=> {
	window.location.hash = `document=${documentID}`;
};

const render = ()=> {
	const container = document.getElementById('root');
	const documentID = (window.location.hash.match(/document=([\w\-./]*)/) || [null, 'default'])[1];
	ReactDOM.render(<App key={documentID} documentID={documentID} goToDocument={goToDocument}></App>, container);
};

window.addEventListener('hashchange', render);
render();

registerServiceWorker();
