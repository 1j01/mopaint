import React, { Component } from 'react';
import Login from './Login.js';
import User from './User.js';
import DocumentTitle from './DocumentTitle.js';
import NewDocument from './NewDocument.js';
import DrawingCanvas from './DrawingCanvas.js';
import './App.css';

const {firebase} = window;
const auth = firebase.auth();

class App extends Component {
	constructor() {
		super();
		this.state = {authData: null};
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
		const {authData} = this.state;
		if (!authData) {
			return <Login></Login>;
		}
		const signOut = ()=> {
			auth.signOut();
		};
		const documentsRef = firebase.database().ref("documents");
		const documentRef = documentsRef.child(documentID);
		const documentTitleRef = documentRef.child("title");
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
					<div className="Toolbox">Toolbox</div>
					<div className="Palette">Palette</div>
					<DrawingCanvas></DrawingCanvas>
				</main>
			</div>
		);
	}
}

export default App;
