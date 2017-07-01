import React, { Component } from 'react';
import ErrorMessage from './ErrorMessage.js';
import './DocumentTitle.css';

class DocumentTitle extends Component {
	constructor() {
		super();
		this.state = {title: "", error: null};
	}
	componentDidMount() {
		const ref = this.props.documentTitleRef;
		ref.on("value", this.titleValueListener = (snapshot)=> {
			this.setState({title: snapshot.val() || ""});
		});
	}
	componentWillUnmount() {
		const ref = this.props.documentTitleRef;
		ref.off("value", this.titleValueListener);
	}
	render() {
		const ref = this.props.documentTitleRef;
		const onChange = (event)=> {
			ref.set(event.target.value)
			.then(()=> {
				this.setState({error: null});
			})
			.catch((err)=> {
				this.setState({error: err});
			});
		};

		return (
			<div className="DocumentTitle">
				<input className="DocumentTitle-input" value={this.state.title} onChange={onChange} placeholder="Document Title"></input>
				<ErrorMessage error={this.state.error}></ErrorMessage>
			</div>
		);
	}
}

export default DocumentTitle;
