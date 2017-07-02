import React, { Component } from 'react';
import Login from './Login.js';
import User from './User.js';
import DocumentTitle from './DocumentTitle.js';
import NewDocument from './NewDocument.js';
import DrawingCanvas from './DrawingCanvas.js';
import Palette from './Palette.js';
import defaultPalette from '../db32-palette.js';
import './App.css';

const {firebase} = window;
const auth = firebase.auth();

class App extends Component {
	constructor() {
		super();
		this.state = {authData: null, selectedSwatch: defaultPalette[0]};
	}
	componentDidMount() {
		this.unsubscribeAuthStateChanged = auth.onAuthStateChanged((authData)=> {
			this.setState({authData});
		});
	}
	componentWillUnmount() {
		this.unsubscribeAuthStateChanged();
	}
	render() {
		const {documentID, goToDocument} = this.props;
		const {authData, selectedSwatch} = this.state;

		if (!authData) {
			return <Login></Login>;
		}
		const signOut = ()=> {
			auth.signOut();
		};
		const documentsRef = firebase.database().ref("documents");
		const documentRef = documentsRef.child(documentID);
		const documentTitleRef = documentRef.child("title");

		const selectSwatch = (swatch)=> {
			this.setState({selectedSwatch: swatch});
		};
		return (
			<div className="App">
				<header>
					<NewDocument documentsRef={documentsRef} goToDocument={goToDocument} authData={authData}></NewDocument>
					<DocumentTitle documentTitleRef={documentTitleRef}></DocumentTitle>
					<User authData={authData}>
						<button className="sign-out" onClick={signOut}>Sign Out</button>
					</User>
				</header>
				<main>
					<div className="toolbox-placeholder">There's no Toolbox yet</div>
					<Palette palette={defaultPalette} selectedSwatch={selectedSwatch} selectSwatch={selectSwatch}></Palette>
					<DrawingCanvas selectedSwatch={selectedSwatch}></DrawingCanvas>
				</main>
			</div>
		);
	}
}

export default App;
