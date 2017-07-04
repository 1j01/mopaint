import React, {Component} from 'react';
import './ErrorMessage.css';

class ErrorMessage extends Component {
	render() {
		const {error} = this.props;
		if (error) {
			return (
				<div className="ErrorMessage" role="alert">
					{error.toString()}
				</div>
			);
		} else {
			return null;
		}
	}
}

export default ErrorMessage;
