import React, {Component} from 'react';
import ErrorMessage from './ErrorMessage.js';
import RaisedButton from 'material-ui/RaisedButton';
import './Login.css';

const {firebase} = window;
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

class Login extends Component {
	constructor() {
		super();
		this.state = {error: null};
	}
	render() {
		const sign_in = ()=> {
			return auth.signInWithPopup(provider)
			.then((authData)=> {
				this.setState({error: null});
			})
			.catch((err)=> {
				this.setState({error: err});
			});
		};

		return (
			<div className="Login">
				<RaisedButton className="Login-button" onClick={sign_in} label="Sign In with Google" primary />
				<ErrorMessage error={this.state.error} />
			</div>
		);
	}
}

export default Login;
