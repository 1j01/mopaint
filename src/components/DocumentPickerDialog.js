import localforage from "localforage";
import React from "react";
import PropTypes from "prop-types";
import Dialog from "./Dialog.js";
import "./DocumentPickerDialog.css";

class DocumentPickerDialog extends React.Component {
	constructor(props) {
		super(props);
		this.state = {documentIDs: null};
	}
	componentDidMount() {
		const updateDocumentsList = () =>
			localforage.keys().then((keys) => {
				const documentIDs = keys
					.map((key) => key.match(/document:([a-zA-Z0-9\-_]+):state/))
					.filter((match) => match)
					.map((match) => match[1]);
				this.setState({documentIDs});
			});
		updateDocumentsList();
		this.iid = setInterval(updateDocumentsList, 600);
	}
	componentWillUnmount() {
		clearInterval(this.iid);
	}
	render() {
		// TODO: sort list
		// TODO: document names
		// TODO: document thumbnails
		// currentDocumentID may not be in documentIDs if the document is not yet saved, but should be listed for consistency
		let content = "Loading documents list...";
		
		if (this.state.documentIDs) {
			const documentIDs = [this.props.currentDocumentID, ...this.state.documentIDs.filter((id)=> id !== this.props.currentDocumentID)];
			const documentListItems = documentIDs.map((documentID) => {
				return (
					<li data-document-id={documentID} key={documentID}>
						<a href={`?document=${documentID}`}>
							Untitled <span style={{color: "gray", fontFamily: "monospace"}}>({documentID})</span>
						</a>
					</li>
				);
			})
			content = documentListItems;
		}
		return <Dialog
			message={
				<div className="document-picker-dialog-message">
					<ul className="document-picker-dialog-documents">
						{content}
					</ul>
				</div>
			}
			close={this.props.close}
		/>;
	}
}

DocumentPickerDialog.propTypes = {
	currentDocumentID: PropTypes.string.isRequired,
	close: PropTypes.func.isRequired,
};

export default DocumentPickerDialog;
