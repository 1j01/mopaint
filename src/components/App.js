import {List} from 'immutable';
import React, {Component} from 'react';
import DrawingCanvas from './DrawingCanvas.js';
import Toolbox from './Toolbox.js';
import Colorbox from './Colorbox.js';
import defaultPalette from '../db32-palette.js';
import tools from '../tools/';
import './App.css';

class App extends Component {
	constructor() {
		super();
		this.state = {
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
		window.removeEventListener("keydown", this.keyDownListener);
	}
	componentWillReceiveProps(nextProps) {
		console.assert(
			nextProps.documentID === this.props.documentID,
			"App component is not designed to handle switching documents without reconstruction"
		);
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
		const {selectedSwatch, selectedTool} = this.state;

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
