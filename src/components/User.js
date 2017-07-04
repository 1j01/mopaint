import React, { Component } from 'react';
import Avatar from 'material-ui/Avatar';

import './User.css';

class User extends Component {
	render() {
		const {authData, showName} = this.props;
		return (
			<div className="User">
				<Avatar src={authData.photoURL} backgroundColor="transparent" size={30}></Avatar>
				{showName && <div className="User-name">{authData.displayName}</div>}
			</div>
		);
	}
}

export default User;
