import {List} from 'immutable';
import React, {Component} from 'react';
import {Toolbar, ToolbarGroup} from 'material-ui/Toolbar';
import IconButton from 'material-ui/IconButton';
import IconMenu from 'material-ui/IconMenu';
import MenuItem from 'material-ui/MenuItem';
import FlatButton from 'material-ui/FlatButton';
import Login from './Login.js';
import User from './User.js';
import DocumentTitle from './DocumentTitle.js';
import DrawingCanvas from './DrawingCanvas.js';
import Toolbox from './Toolbox.js';
import Colorbox from './Colorbox.js';
import defaultPalette from '../db32-palette.js';
import tools from '../tools/';
import './App.css';

const {firebase} = window;
const auth = firebase.auth();

const UserMenu = (props) => {
	const {authData, signOut} = props;
	return (
		<IconMenu
			iconButtonElement={
				<IconButton style={{width: 50, height: 50, padding: 10}}>
					<User authData={authData} />
				</IconButton>
			}
			targetOrigin={{horizontal: 'right', vertical: 'top'}}
			anchorOrigin={{horizontal: 'right', vertical: 'top'}}
		>
			<MenuItem primaryText="Sign out" onTouchTap={signOut} />
		</IconMenu>
	);
};

class App extends Component {
	constructor() {
		super();
		this.state = {
			authData: null,
			selectedSwatch: defaultPalette[0],
			selectedTool: tools[0],
			undos: new List(),
			redos: new List(),
		};
		this.documentCanvas = document.createElement("canvas");
		this.documentContext = this.documentCanvas.getContext("2d");
		this.documentCanvas.width = 640;
		this.documentCanvas.height = 480;
	}
	componentDidMount() {
		this.unsubscribeAuthStateChanged = auth.onAuthStateChanged((authData)=> {
			this.setState({authData});
		});
		window.addEventListener("keydown", this.keyDownListener = (event)=> {
			if (event.ctrlKey) {
				if (event.key === "z") {
					this.undo();
					this.drawingCanvasComponent.draw();
				} else if (event.key === "Z" || event.key === "y") {
					this.redo();
					this.drawingCanvasComponent.draw();
				}
			}
		});
	}
	componentWillUnmount() {
		this.unsubscribeAuthStateChanged();
		window.removeEventListener("keydown", this.keyDownListener);
	}

	undo () {
		const {undos, redos} = this.state;
		const {documentContext} = this;

		if (undos.size < 1 ) {
			return false;
		}

		const action = undos.last();
		this.setState({
			undos: undos.slice(0, undos.size - 1),
			redos: redos.push(action)
		});

		action.applyReverse(documentContext);
	}
	redo () {
		const {undos, redos} = this.state;
		const {documentContext} = this;

		if (redos.size < 1 ) {
			return false;
		}

		const action = redos.last();
		this.setState({
			undos: undos.push(action),
			redos: redos.slice(0, redos.size - 1)
		});

		action.apply(documentContext);
	}

	render() {
		const {documentID, goToDocument, createNewDocument} = this.props;
		const {authData, selectedSwatch, selectedTool} = this.state;

		if (!authData) {
			return <Login />;
		}
		const signOut = ()=> {
			auth.signOut();
		};
		const documentsRef = firebase.database().ref("documents");
		const documentRef = documentsRef.child(documentID);
		const documentTitleRef = documentRef.child("title");

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

		const selectSwatch = (swatch)=> {
			this.setState({selectedSwatch: swatch});
		};
		const selectTool = (tool)=> {
			this.setState({selectedTool: tool});
		};

		const undoable = (action)=> {
			const {undos} = this.state;
			const {documentContext} = this;
			this.setState({
				undos: undos.push(action)
			});
			action.apply(documentContext);
		};

		const {documentContext, documentCanvas} = this;
		return (
			<div className="App">
				<Toolbar>
					<ToolbarGroup firstChild={true}>
						<FlatButton onClick={createAndGoToNewDocument} label="New Document"/>
						<DocumentTitle documentTitleRef={documentTitleRef} />
					</ToolbarGroup>
					<ToolbarGroup>
						<UserMenu authData={authData} signOut={signOut} />
					</ToolbarGroup>
				</Toolbar>
				<main>
					<Toolbox tools={tools} selectedTool={selectedTool} selectTool={selectTool} />
					<Colorbox palette={defaultPalette} selectedSwatch={selectedSwatch} selectSwatch={selectSwatch} />
					<DrawingCanvas
						selectedSwatch={selectedSwatch}
						selectedTool={selectedTool}
						undoable={undoable}
						documentContext={documentContext}
						documentCanvas={documentCanvas}
						ref={(component) => { this.drawingCanvasComponent = component; }}
					/>
				</main>
			</div>
		);
	}
}

export default App;
