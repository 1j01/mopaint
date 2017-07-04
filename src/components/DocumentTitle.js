import React, { Component } from 'react';
import TextField from 'material-ui/TextField';
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
			<TextField
				className="DocumentTitle"
				value={this.state.title}
				onChange={onChange}
				hintText="Document Title"
				errorText={this.state.error && this.state.error.toString()}
			/>
		);
	}
}

export default DocumentTitle;
