import React, { Component } from 'react';
import Avatar from 'material-ui/Avatar';

import './User.css';

class User extends Component {
	render() {
		const {authData} = this.props;
		return (
			<div className="User">
				<Avatar src={authData.photoURL} backgroundColor="transparent" size={30}></Avatar>
			</div>
		);
	}
}

export default User;
