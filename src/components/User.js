import React, { Component } from 'react';
import './User.css';

class User extends Component {
	render() {
		const {authData, children} = this.props;
		return (
			<div className="User">
				<img className="User-image" src={authData.photoURL} alt=""></img>
				<div className="User-name">{authData.displayName}</div>
				{children}
			</div>
		);
	}
}

export default User;
