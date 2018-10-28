import localforage from "localforage";
import { List } from "immutable";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { load as loadPalette } from "anypalette";
import DrawingCanvas from "./DrawingCanvas.js";
import Toolbox from "./Toolbox.js";
import Colorbox from "./Colorbox.js";
import HistoryView from "./HistoryView.js";
import Warning from "./Warning.js";
import defaultPalette from "../db32-palette.js";
import tools from "../tools/";
import "./App.css";

const CURRENT_SERIALIZATION_VERSION = 1;

class App extends Component {
	constructor() {
		super();
		// TODO: move state outside of the component
		this.state = {
			palette: defaultPalette, // TODO: eventually remove the "palette" state as a concept;
			// I don't think this feature is special enough to warrant special handling (except for parsing palette files)
			// It can be part of the document, and more dynamic, and could be shared with other documents the same way(s) as tools
			selectedSwatch: defaultPalette[0],
			selectedTool: tools[0],
			undos: new List(),
			redos: new List(),
			// operations: new List(),
			loaded: false,
			loadFailed: false,
			documentIDs: [], // or null, TODO: loading indicator
		};
		this.documentCanvas = document.createElement("canvas");
		this.documentContext = this.documentCanvas.getContext("2d");
		this.documentCanvas.width = 640;
		this.documentCanvas.height = 480;

		// TODO: move cache state out here
		this.thumbnailsByOperation = new Map(); // TODO: could use cache

		this.timeoutIDs = new Set();
		const debounce = (func, delay) => {
			let timeoutID;
			return () => {
				clearTimeout(timeoutID);
				this.timeoutIDs.delete(timeoutID);
				timeoutID = setTimeout(func, delay);
				this.timeoutIDs.add(timeoutID);
			};
		};
		this.saveDebounced = debounce(this.save.bind(this), 500);

		// TODO: move outside of App component so it doesn't become unpopulated when switching documents
		// (also maybe make App to handle switching documents (without unmounting))
		const periodicallyUpdateDocumentsList = () => {
			localforage.keys().then((keys) => {
				const documentIDs = keys
					.map((key) => key.match(/document:([a-zA-Z0-9\-_]+):state/))
					.filter((key) => key)
					.map((key) => key[1]);
				this.setState({ documentIDs });
			});
			const timeoutID = setTimeout(periodicallyUpdateDocumentsList, 600);
			this.timeoutIDs.add(timeoutID);
		};
		periodicallyUpdateDocumentsList();
	}
	load() {
		if (!this.props.documentID) {
			console.log(`No document ID to load`);
			return;
		}
		console.log(`Load ${this.props.documentID}`);
		localforage.getItem(
			`document:${this.props.documentID}:state`,
			(error, serialized) => {
				if (error) {
					alert(
						"Failed to load document from storage! See console for details."
					);
					console.error("Failed to load document from storage!", error);
					return;
				}
				if (!serialized) {
					this.setState({ loaded: true });
					console.log(
						`State not loaded for document:${this.props.documentID}:state`
					);
					return;
				}
				if (
					typeof serialized.version !== "number" ||
					serialized.version > CURRENT_SERIALIZATION_VERSION
				) {
					alert(
						"Can't load document state created by later version of the app"
					);
					return;
				}
				const MINIMUM_LOADABLE_VERSION = 1;
				// upgrading code can go here, incrementing the version number step by step
				// if(serialized.version === 0){
				// 	serialized.newPropName = serialized.oldName;
				// 	delete serialized.oldName;
				// 	serialized.version = 1;
				// }
				if (serialized.version < CURRENT_SERIALIZATION_VERSION) {
					alert(
						`Can't load document state created by old version of the app; there's no upgrade path from format version ${
							serialized.version
						} to ${MINIMUM_LOADABLE_VERSION} currently`
					);
					return;
				}
				const findToolByID = (toolID, locationMessage) => {
					const tool = tools.find((tool) => tool.name === toolID);
					if (!tool) {
						throw new TypeError(`unknown tool '${toolID}' ${locationMessage}`);
					}
					return tool;
				};
				const expectPropertiesToExist = (
					properties,
					object,
					locationMessage
				) => {
					properties.forEach((key) => {
						if (!object[key]) {
							throw new TypeError(
								`expected property '${key}' ${locationMessage}`
							);
						}
					});
				};
				const deserializeOperation = (serializedOperation) => {
					expectPropertiesToExist(
						["id", "toolID", "points", "swatch"],
						serializedOperation,
						`on operation with ID ${serializedOperation.id}`
					);
					const tool = findToolByID(
						serializedOperation.toolID,
						`on operation with ID ${serializedOperation.id}`
					);
					return {
						id: serializedOperation.id,
						tool: tool,
						points: serializedOperation.points,
						swatch: serializedOperation.swatch,
					};
				};
				console.log(`Loaded ${this.props.documentID}`);
				// this try-catch is mainly for the explicitly thrown TypeErrors,
				// but TODO: maybe wrap all the loading logic, and maybe saving too
				try {
					expectPropertiesToExist(
						["palette", "selectedSwatch", "selectedToolID", "undos", "redos"],
						serialized,
						"on the root document object"
					);
					this.setState({
						palette: serialized.palette,
						selectedSwatch: serialized.selectedSwatch,
						selectedTool: findToolByID(serialized.selectedToolID),
						undos: new List(serialized.undos.map(deserializeOperation)),
						redos: new List(serialized.redos.map(deserializeOperation)),
						loaded: true,
					});
				} catch (error) {
					alert("Failed to load document! See console for details.");
					console.error("Failed to load document!", error);
				}
			}
		);
	}
	save(leavingThisDocument) {
		if (!this.state.loaded) {
			if (!leavingThisDocument) {
				if (
					window.confirm(
						`The document ${
							this.state.loadFailed ? "failed to load" : "hasn't loaded yet"
						}. Create a new document?`
					)
				) {
					this.props.createNewDocument();
				}
			}
			return;
		}
		// TODO: serialize tools as code (+ identifiers), and create a sandbox
		// at least try to include code for future compatibility
		const serializeOperation = (operation) => {
			return {
				id: operation.id,
				toolID: operation.tool.name,
				// toolCode: operation.tool.toString(), // not enough to define it; need the whole module
				points: operation.points,
				swatch: operation.swatch,
			};
		};
		const serialized = {
			version: 1,
			palette: this.state.palette,
			selectedSwatch: this.state.selectedSwatch,
			selectedToolID: this.state.selectedTool.name,
			undos: this.state.undos.toJS().map(serializeOperation),
			redos: this.state.redos.toJS().map(serializeOperation),
		};
		localforage.setItem(
			`document:${this.props.documentID}:state`,
			serialized,
			(error) => {
				if (error) {
					alert(
						"Failed to save document into storage! See console for details."
					);
					console.error("Failed to save document into storage!", error);
				} else {
					console.log(
						`Saved ${this.props.documentID}${
							leavingThisDocument ? " (leaving it)" : ""
						}`
					);
				}
			}
		);
	}
	componentDidMount() {
		this.load();

		window.addEventListener(
			"beforeunload",
			(this.beforeUnloadListener = (event) => {
				this.save(true); // this isn't the only time we save, it's just that there's some timeout based saving, so this is good to have
			})
		);

		window.addEventListener(
			"keydown",
			(this.keyDownListener = (event) => {
				if (event.ctrlKey) {
					if (event.key === "z") {
						this.undo();
					} else if (event.key === "Z" || event.key === "y") {
						this.redo();
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
		this.save(true);
		this.timeoutIDs.forEach((timeoutID) => {
			clearTimeout(timeoutID);
		});
		window.removeEventListener("beforeunload", this.beforeUnloadListener);
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

	// TODO: collaborative sync with undo/redo, showing operations from other users in realtime
	// Note: should be able to support time-based tools in a reproducible way
	// with timestamps and periodic updates to the lastest timestamp
	// and support psuedorandomness by seeding from operation ID
	// TODO: move this state manipulation stuff out of the component
	addOperation(operation) {
		this.setState(
			{ undos: this.state.undos.push(operation) },
			this.save.bind(this)
		);
	}
	updateOperation(operation) {
		// TODO: immutable operation objects probably (immutable.js has a Record class, I could use that)
		// or append-only operation state?
		// TODO: soft undo/redo / fundo/freedo / sliding/gliding/partial undo/redo
		this.setState({ undos: this.state.undos }, this.saveDebounced.bind(this));
	}
	undo() {
		const { undos, redos } = this.state;

		if (undos.size < 1) {
			return false;
		}

		const action = undos.last();
		this.setState({
			undos: undos.pop(),
			redos: redos.push(action),
		});
	}
	redo() {
		const { undos, redos } = this.state;

		if (redos.size < 1) {
			return false;
		}

		const action = redos.last();
		this.setState({
			undos: undos.push(action),
			redos: redos.pop(),
		});
	}

	render() {
		const {
			selectedSwatch,
			selectedTool,
			palette,
			undos,
			documentIDs,
		} = this.state;

		const selectSwatch = (swatch) => {
			this.setState({ selectedSwatch: swatch });
		};
		const selectTool = (tool) => {
			this.setState({ selectedTool: tool });
		};

		const goToEntry = (entry) => {
			const { undos, redos } = this.state;
			var indexInUndos = undos.indexOf(entry);
			var indexInRedos = redos.indexOf(entry);
			var isCurrent = entry === undos.last();
			if (isCurrent) {
				return;
			}
			// the item you click on should become the last item in undos
			if (indexInUndos > -1) {
				const actionsToUndo = undos.slice(indexInUndos + 1, undos.size);
				this.setState({
					undos: undos.slice(0, indexInUndos + 1),
					redos: redos.concat(actionsToUndo.reverse()),
				});
				return;
			}
			if (indexInRedos > -1) {
				const actionsToRedo = redos.slice(indexInRedos, redos.size);
				this.setState({
					undos: undos.concat(actionsToRedo.reverse()),
					redos: redos.slice(0, indexInRedos),
				});
				return;
			}
			alert(
				"Something bad happened and somehow the entry wasn't found in undos or redos. You should report this bug."
			);
		};

		return (
			<div className="App">
				<main>
					{/* prettier-ignore */}
					<Warning>
						⚠
						The state of the app is persisted across reloads, but there's not yet a way to save a document file,
						and as far as saving an image goes, all you've got is your browser's context menu, if it provides a "Save image as" option or similar.
						<br/>
						<br/>
						This app is in very early stages of development,
						and it doesn't represent the future vision for this project,
						like at all. Except that there's (some sort of) a history view, pretty early on...
						and that undo/redo history is persisted.
						See the <a href="https://github.com/1j01/mopaint#mopaint" target="_blank">README on GitHub for more info</a>.
					</Warning>
					<div>
						<label>
							Switch documents:&nbsp;
							<select
								value={this.props.documentID}
								onChange={(event) =>
									this.props.goToDocument(event.target.value)
								}
							>
								>
								{documentIDs.map((documentID) => {
									return (
										<option value={documentID} key={documentID}>
											Untitled ({documentID})
										</option>
									);
								})}
							</select>
						</label>
					</div>
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
						documentContext={this.documentContext}
						documentCanvas={this.documentCanvas}
						addOperation={this.addOperation.bind(this)}
						updateOperation={this.updateOperation.bind(this)}
						operations={undos}
						thumbnailsByOperation={this.thumbnailsByOperation}
						ref={(component) => {
							this.drawingCanvasComponent = component;
						}}
					/>
				</main>
				{/* TODO: resizable sidebar */}
				<div className="sidebar">
					<HistoryView
						// operations={this.state.operations}
						undos={this.state.undos}
						redos={this.state.redos}
						goToEntry={goToEntry}
						thumbnailsByOperation={this.thumbnailsByOperation}
					/>
				</div>
			</div>
		);
	}
}

App.propTypes = {
	documentID: PropTypes.string.isRequired,
	goToDocument: PropTypes.func.isRequired,
	createNewDocument: PropTypes.func.isRequired,
};

export default App;
