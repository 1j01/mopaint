import { List } from "immutable";
import React, { Component } from "react";
import DrawingCanvas from "./DrawingCanvas.js";
import Toolbox from "./Toolbox.js";
import Colorbox from "./Colorbox.js";
import HistoryView from "./HistoryView.js";
import defaultPalette from "../db32-palette.js";
import tools from "../tools/";
import "./App.css";

class App extends Component {
	constructor() {
		super();
		// TODO: move state outside of the component
		// also save data (in an at least *somewhat* future-proof way)
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
		window.addEventListener(
			"keydown",
			(this.keyDownListener = (event) => {
				if (event.ctrlKey) {
					if (event.key === "z") {
						this.undo();
						this.drawingCanvasComponent.draw();
					} else if (event.key === "Z" || event.key === "y") {
						this.redo();
						this.drawingCanvasComponent.draw();
					}
				}
			})
		);
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

	// TODO: move these out of the component
	undo() {
		const { undos, redos } = this.state;
		const { documentContext } = this;

		if (undos.size < 1) {
			return false;
		}

		const action = undos.last();
		this.setState({
			undos: undos.pop(),
			redos: redos.push(action),
		});

		action.applyReverse(documentContext);
	}
	redo() {
		const { undos, redos } = this.state;
		const { documentContext } = this;

		if (redos.size < 1) {
			return false;
		}

		const action = redos.last();
		this.setState({
			undos: undos.push(action),
			redos: redos.pop(),
		});

		action.apply(documentContext);
	}

	render() {
		const { selectedSwatch, selectedTool } = this.state;

		const selectSwatch = (swatch) => {
			this.setState({ selectedSwatch: swatch });
		};
		const selectTool = (tool) => {
			this.setState({ selectedTool: tool });
		};

		const undoable = (action) => {
			const { undos } = this.state;
			const { documentContext } = this;
			this.setState({
				undos: undos.push(action),
			});
			action.apply(documentContext);
		};

		const goToEntry = (entry) => {
			alert("TODO: allow selecting different points in history");
			// const { undos, redos } = this.state;
			// var indexInUndos = undos.indexOf(entry);
			// var indexInRedos = redos.indexOf(entry);
			// var isCurrent = entry === undos.last();
			// if (isCurrent) {
			// 	return;
			// }
			// if (indexInUndos) {
			// 	const actionsToApply = undos.slice(indexInUndos, undos.size);
			// 	this.setState({
			// 		undos: undos.slice(0, indexInUndos),
			// 		redos: redos.concat(actionsToApply),
			// 	});
			// 	for (var i=0; i<indexInUndos; i++){

			// 	}
			// }
			// actionsToApply.forEach((action)=> action.apply());
		};

		const { documentContext, documentCanvas } = this;
		return (
			<div className="App">
				<main>
					<Toolbox
						tools={tools}
						selectedTool={selectedTool}
						selectTool={selectTool}
					/>
					<Colorbox
						palette={defaultPalette}
						selectedSwatch={selectedSwatch}
						selectSwatch={selectSwatch}
					/>
					<DrawingCanvas
						selectedSwatch={selectedSwatch}
						selectedTool={selectedTool}
						undoable={undoable}
						documentContext={documentContext}
						documentCanvas={documentCanvas}
						ref={(component) => {
							this.drawingCanvasComponent = component;
						}}
					/>
				</main>
				{/* TODO: resizable sidebar */}
				<div className="sidebar">
					<HistoryView
						undos={this.state.undos}
						redos={this.state.redos}
						goToEntry={goToEntry}
					/>
				</div>
			</div>
		);
	}
}

export default App;
