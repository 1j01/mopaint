import localforage from "localforage";
import React from "react";
import PropTypes from "prop-types";
import Dialog from "./Dialog.js";
import "./DocumentPickerDialog.css";

class DocumentOption extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			name: "Untitled",
			thumbnailBlobURL: null,
		};
	}
	componentDidMount() {
		const { documentID } = this.props;
		localforage.getItem(`document:${documentID}:name`).then((name) => {
			if (name) {
				this.setState({ name });
			}
		});
		localforage.getItem(`document:${documentID}:thumbnail`).then((thumbnailBlob) => {
			if (thumbnailBlob) {
				this.setState({ thumbnailBlobURL: URL.createObjectURL(thumbnailBlob) });
			}
		});
	}
	componentWillUnmount() {
		URL.revokeObjectURL(this.state.thumbnailBlobURL);
	}
	render() {
		const { documentID } = this.props;
		return <a href={`?document=${documentID}`}>
			<div className="document-thumbnail">
				<img src={this.state.thumbnailBlobURL} alt="" />
			</div>
			{this.state.name || "Untitled"}
		</a>;
	}
}

DocumentOption.propTypes = {
	documentID: PropTypes.string.isRequired,
};
class DocumentPickerDialog extends React.Component {
	constructor(props) {
		super(props);
		this.state = { documentIDs: null };
	}
	componentDidMount() {
		const updateDocumentsList = () =>
			localforage.keys().then((keys) => {
				let documentIDs = keys
					.map((key) => key.match(/document:([a-zA-Z0-9\-_]+):state/))
					.filter((match) => match)
					.map((match) => match[1]);
				// currentDocumentID may not be in documentIDs if the document is not yet saved, but should be listed for consistency
				documentIDs = [this.props.currentDocumentID, ...documentIDs.filter((id) => id !== this.props.currentDocumentID)];

				// TODO: sort in more reasonable way(s) like modified time, accessed time
				// for now, this just makes the order stay the same when switching documents 
				documentIDs.sort();

				this.setState({ documentIDs });
			});
		updateDocumentsList();
		this.iid = setInterval(updateDocumentsList, 600);
	}
	componentWillUnmount() {
		clearInterval(this.iid);
	}
	render() {
		let content = "Loading documents list...";

		if (this.state.documentIDs) {
			const documentListItems = this.state.documentIDs.map((documentID) => {
				return (
					<li data-document-id={documentID} key={documentID}>
						<DocumentOption documentID={documentID} />
					</li>
				);
			});
			content = documentListItems;
		}
		return <Dialog
			maxWidth=""
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
