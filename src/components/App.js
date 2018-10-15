import { List } from "immutable";
import React, { Component } from "react";
import { load as loadPalette } from "anypalette";
import DrawingCanvas from "./DrawingCanvas.js";
import Toolbox from "./Toolbox.js";
import Colorbox from "./Colorbox.js";
import HistoryView from "./HistoryView.js";
import Warning from "./Warning.js";
import defaultPalette from "../db32-palette.js";
import tools from "../tools/";
import "./App.css";

class App extends Component {
	constructor() {
		super();
		// TODO: move state outside of the component
		// also save data (in an at least *somewhat* future-proof way)
		this.state = {
			palette: defaultPalette, // TODO: eventually remove the "palette" state as a concept; I don't think this feature isn't special enough to warrant special handling (except for parsing palette files)
			// it can be part of the document, and more dynamic, and could be shared with other documents the same way(s) as tools
			selectedSwatch: defaultPalette[0],
			selectedTool: tools[0],
			undos: new List(),
			redos: new List(),
			// document: {
			operations: new List(),
			// },
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

		const handleDroppedFiles = (files) => {
			if (files[0]) {
				// TODO: handle image files, Photoshop documents, GIMP documents, etc.
				loadPalette(files[0], (error, palette) => {
					if (error) {
						// TODO: show error in a nice way
						alert(error);
					} else {
						this.setState({
							palette: palette.map((color) => color.toString()),
						});
					}
				});
			}
		};

		window.addEventListener(
			"dragover",
			(this.dragOverLister = (e) => {
				e.preventDefault();
			})
		);
		window.addEventListener(
			"drop",
			(this.dropListener = (e) => {
				e.preventDefault();
				handleDroppedFiles(e.dataTransfer.files);
			})
		);
	}
	componentWillUnmount() {
		window.removeEventListener("keydown", this.keyDownListener);
		window.removeEventListener("dragover", this.dragOverListener);
		window.removeEventListener("drop", this.dropListener);
	}
	componentWillReceiveProps(nextProps) {
		console.assert(
			nextProps.documentID === this.props.documentID,
			"App component is not designed to handle switching documents without reconstruction"
		);
	}

	// TODO: move these out of the component
	// TODO: collaborative sync with undo/redo...
	addOperation(operation) {
		this.setState({ operations: this.state.operations.push(operation) });
	}
	updateOperation(operation) {
		// TODO: immutable operation objects probably
		// this.setState({operations: this.state.operations.set(operations.indexOf(operation), operation)});
		this.setState({ operations: this.state.operations });
		// console.log(this.state.operations); // log would need to move if async actually changing it
	}
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
		const { selectedSwatch, selectedTool, palette, operations } = this.state;

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
			alert("History navigation is not yet (re-)implemented.");
			return;
			const { undos, redos } = this.state;
			const { documentContext } = this;
			var indexInUndos = undos.indexOf(entry);
			var indexInRedos = redos.indexOf(entry);
			var isCurrent = entry === undos.last();
			if (isCurrent) {
				return;
			}
			// the item you click on should become the last item in undos
			if (indexInUndos > -1) {
				const actionsToApplyReverse = undos.slice(indexInUndos + 1, undos.size);
				this.setState({
					undos: undos.slice(0, indexInUndos + 1),
					redos: redos.concat(actionsToApplyReverse.reverse()),
				});
				actionsToApplyReverse.reverse().forEach((action) => {
					action.applyReverse(documentContext);
				});
				this.drawingCanvasComponent.draw();
				return;
			}
			if (indexInRedos > -1) {
				const actionsToApply = redos.slice(indexInRedos, redos.size);
				this.setState({
					undos: undos.concat(actionsToApply.reverse()),
					redos: redos.slice(0, indexInRedos),
				});
				actionsToApply.reverse().forEach((action) => {
					action.apply(documentContext);
				});
				this.drawingCanvasComponent.draw();
				return;
			}
			alert(
				"Something bad happened and somehow the entry wasn't found in undos or redos. You should report this bug."
			);
		};

		const { documentContext, documentCanvas } = this;
		return (
			<div className="App">
				<main>
					{/* prettier-ignore */}
					<Warning>
						⚠
						Saving is not yet implemented!
						This app is in very early stages of development,
						and it doesn't represent the future vision for this project,
						like at all. Except that there's (some sort of) a history view, pretty early on.
						See the <a href="https://github.com/1j01/mopaint#mopaint" target="_blank">README on GitHub</a>.
					</Warning>
					<Toolbox
						tools={tools}
						selectedTool={selectedTool}
						selectTool={selectTool}
					/>
					<Colorbox
						palette={palette}
						selectedSwatch={selectedSwatch}
						selectSwatch={selectSwatch}
					/>
					<DrawingCanvas
						selectedSwatch={selectedSwatch}
						selectedTool={selectedTool}
						undoable={undoable}
						documentContext={documentContext}
						documentCanvas={documentCanvas}
						addOperation={this.addOperation.bind(this)}
						updateOperation={this.updateOperation.bind(this)}
						operations={operations}
						ref={(component) => {
							this.drawingCanvasComponent = component;
						}}
					/>
				</main>
				{/* TODO: resizable sidebar */}
				<div className="sidebar">
					<HistoryView
						// operations={this.state.operations}
						// undos={this.state.undos}
						undos={this.state.operations}
						redos={this.state.redos}
						goToEntry={goToEntry}
					/>
				</div>
			</div>
		);
	}
}

export default App;
