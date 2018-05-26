import { List } from "immutable";
import React, { Component } from "react";
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
