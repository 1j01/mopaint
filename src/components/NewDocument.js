import React, { Component } from 'react';
import './NewDocument.css';

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

class NewDocument extends Component {
	render() {
		const {documentsRef, goToDocument, authData} = this.props;
		const createAndGoToNewDocument = ()=> {
			createNewDocument(documentsRef, authData.uid, (err, newDocumentID)=> {
				if (err) {
					// TODO: visible error
					console.error('Failed to create new document', err);
				} else {
					goToDocument(newDocumentID);
				}
			});
		};
		return (
			<button className="NewDocument" onClick={createAndGoToNewDocument}>
				New Document
			</button>
		);
	}
}

export default NewDocument;
