import localforage from "localforage";
import { List } from "immutable";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { load as loadPalette } from "anypalette";
import isPNG from "is-png";
import { injectMetadataIntoBlob, readMetadataSync } from "../png-metadata.js";
import DrawingCanvas from "./DrawingCanvas.js";
import Toolbox from "./Toolbox.js";
import Colorbox from "./Colorbox.js";
import HistoryView from "./HistoryView.js";
import Dialog from "./Dialog.js";
import Warning from "./Warning.js";
import defaultPalette from "../db32-palette.js";
import tools from "../tools/";
import "./App.css";
import { ReactComponent as NewDocumentIcon } from "../icons/small-n-flat/document-new-importable.svg";
import { ReactComponent as OpenDocumentIcon } from "../icons/small-n-flat/document-open-importable.svg";
import { ReactComponent as SaveDocumentIcon } from "../icons/small-n-flat/document-save-importable.svg";

const CURRENT_SERIALIZATION_VERSION = 0.1;

class App extends Component {
	constructor() {
		super();
		// TODO: move state outside of the component
		this.state = {
			palette: defaultPalette, // TODO: eventually remove the "palette" state as a concept;
			// I don't think this feature is special enough to warrant special handling (except for parsing palette files)
			// It can be part of the document, and more dynamic, and could be shared with other documents the same way(s) as tools
			// (and images could be used as palettes by sampling from them)
			selectedSwatch: defaultPalette[0],
			selectedTool: tools[0],
			undos: new List(),
			redos: new List(),
			// operations: new List(),
			loaded: false,
			loadFailed: false,
		};
		this.documentCanvas = document.createElement("canvas");
		this.documentContext = this.documentCanvas.getContext("2d");
		this.documentCanvas.width = 640;
		this.documentCanvas.height = 480;

		this.thumbnailsByOperation = new Map(); // TODO: could use cache?

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
	}
	loadSerializedDocument(serialized, fromFile) {
		// TODO: maybe don't call it "state" when more explicitly loading a document, i.e. from a file
		const nounPhraseThingToLoad = fromFile ? "document" : "document state";
		if (
			typeof serialized.formatVersion !== "number" &&
			serialized.version === 1
		) {
			// TODO: get rid of this upgrade eventually
			serialized.format = "mopaint";
			serialized.formatVersion = 0.1;
			delete serialized.version;
		}
		if (serialized.format !== "mopaint") {
			this.showError({
				message: `Can't load ${nounPhraseThingToLoad} - it does not appear to be a Mopaint document`,
			});
			this.setState({ loadFailed: true });
			return;
		}
		if (
			typeof serialized.formatVersion !== "number" ||
			serialized.formatVersion > CURRENT_SERIALIZATION_VERSION
		) {
			this.showError({
				message: `Can't load ${nounPhraseThingToLoad} created by later version of the app`,
			});
			this.setState({ loadFailed: true });
			return;
		}
		const MINIMUM_LOADABLE_VERSION = 0.1;
		// upgrading code can go here, incrementing the version number step by step
		// e.g.
		// if (serialized.formatVersion === 0.1) {
		// 	serialized.newPropName = serialized.oldName;
		// 	delete serialized.oldName;
		// 	serialized.formatVersion = 0.2;
		// }
		if (serialized.formatVersion < CURRENT_SERIALIZATION_VERSION) {
			this.showError({
				message: `Can't load ${nounPhraseThingToLoad} created by old version of the app; there's no upgrade path from format version ${
					serialized.formatVersion
				} to ${CURRENT_SERIALIZATION_VERSION}${
					MINIMUM_LOADABLE_VERSION !== CURRENT_SERIALIZATION_VERSION
						? ` (minimum loadable: ${MINIMUM_LOADABLE_VERSION})`
						: ""
				}`,
			});
			this.setState({ loadFailed: true });
			return;
		}
		const findToolByID = (toolID, locationMessage) => {
			const tool = tools.find((tool) => tool.name === toolID);
			if (!tool) {
				throw new TypeError(`unknown tool '${toolID}' ${locationMessage}`);
			}
			return tool;
		};
		const expectPropertiesToExist = (properties, object, locationMessage) => {
			properties.forEach((key) => {
				if (!object[key]) {
					throw new TypeError(`expected property '${key}' ${locationMessage}`);
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
		// this try-catch is mainly for the explicitly thrown TypeErrors,
		// but TODO: maybe wrap all the loading logic, and maybe saving too
		let stateUpdates;
		try {
			expectPropertiesToExist(
				["palette", "selectedSwatch", "selectedToolID", "undos", "redos"],
				serialized,
				"on the root document object"
			);
			stateUpdates = {
				palette: serialized.palette,
				selectedSwatch: serialized.selectedSwatch,
				selectedTool: findToolByID(
					serialized.selectedToolID,
					"(for the selected tool)"
				),
				undos: new List(serialized.undos.map(deserializeOperation)),
				redos: new List(serialized.redos.map(deserializeOperation)),
				loaded: true,
			};
		} catch (error) {
			this.showError({
				message: "Failed to load document!",
				error,
			});
			this.setState({ loadFailed: true });
		}
		this.setState(stateUpdates, () => {
			console.log(`Loaded ${this.props.documentID}`);
		});
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
					// TODO: detect quota limit
					this.showError({
						message: "Failed to load document state from storage!",
						error,
					});
					this.setState({ loadFailed: true });
					return;
				}
				if (this.props.serializedDocumentToLoad) {
					if (!serialized) {
						this.loadSerializedDocument(this.props.serializedDocumentToLoad);
					} else {
						this.showError({
							message:
								"Almost loaded a document over an existing document. This shouldn't happen!",
							requestABugReport: true,
						});
					}
					return;
				}
				if (!serialized) {
					this.setState({ loaded: true });
					console.log(
						`State loaded as empty for document:${this.props.documentID}:state`
					);
					return;
				}
				console.log(`Loaded data for ${this.props.documentID}`);
				this.loadSerializedDocument(serialized);
			}
		);
	}
	serializeDocument() {
		// TODO: serialize tools as code (+ identifiers), and create a sandbox
		const serializeOperation = (operation) => {
			return {
				id: operation.id,
				toolID: operation.tool.name,
				// toolCode: operation.tool.toString(), // not enough to define it; will need the whole module
				points: operation.points,
				swatch: operation.swatch,
			};
		};
		return {
			format: "mopaint",
			formatVersion: 0.1,
			palette: this.state.palette,
			selectedSwatch: this.state.selectedSwatch,
			selectedToolID: this.state.selectedTool.name,
			undos: this.state.undos.toJS().map(serializeOperation),
			redos: this.state.redos.toJS().map(serializeOperation),
		};
	}
	save(leavingThisDocument) {
		if (!this.state.loaded) {
			if (!leavingThisDocument) {
				// TODO: allow drawing in not-loaded document and carry state over to a new document
				// (and update this message to reflect that (clearly, and reassuringly))
				this.setState({ undos: new List(), redos: new List(), loaded: false });
				this.showError({
					message: `The document ${
						this.state.loadFailed ? "failed to load" : "hasn't loaded yet"
					}. Start a new document?`,
					extraButtons: (
						<button onClick={this.props.createNewDocument}>New Document</button>
					),
				});
			}
			return;
		}
		const serialized = this.serializeDocument();
		localforage.setItem(
			`document:${this.props.documentID}:state`,
			serialized,
			(error) => {
				const documentThatYouWereMaybeLeaving = leavingThisDocument
					? "the previous document"
					: "document";
				// Enable one of these lines to emit Error Message Itself Test (EMIT) errors (I'm coining that! 😛)
				// error = new Error(); error.name = "QuotaExceededError";
				// error = new Error("asdftest"); error.name = "QuotaExceededError";
				if (error) {
					// TODO: investigate these different error cases (in different browsers), and improve the messages
					// This "QuotaExceededError" without a message seems to happen in Chrome when the disk is full
					// but other browsers probably wouldn't do the same thing,
					// so it might make sense to present both possibilities regardless...
					// (but maybe present them in different priority of likeliness?
					// but that might just come across as confusingly inconsistent)
					// Also it might make sense to make it a (small/short) dialog tree,
					// either with separate dialog boxes, or with expandables
					// Also it would be nice to link to documentation (or web searches) to help with checking disk space and freeing it up
					// (e.g. "check disk space <operating system name>")
					// Also once there's a document selector, where you can manage storage, there should be a button to open it,
					// and the message(s) should be updated; no more need to delete all documents
					if (error.name === "QuotaExceededError" && !error.message) {
						this.showError({
							// prettier-ignore
							message: <div>
								Failed to save {documentThatYouWereMaybeLeaving} into storage!
								<br/><br/>
								Check that your computer has enough disk space.
								<br/><br/>
								If you have enough free space, we've run out of space as allowed by the browser per site.
								You could free up quota by clearing the storage for this site in your browser's settings,
								however, this will delete all documents.
							</div>,
							error,
						});
					} else if (error.name === "QuotaExceededError") {
						// We don't *know* it's running into quota limits here, it could be out of disk space in other browsers
						// This "Ran out of space allowed by the browser" is sort of designed to be ambiguous,
						// but that's not a good way to get across the possibility of different scenarios;
						// TODO: find a way to make this clear/better
						this.showError({
							// prettier-ignore
							message: <div>
								Failed to save {documentThatYouWereMaybeLeaving} into storage!
								<br/><br/>
								Ran out of space allowed by the browser.
								You could free up quota by clearing the storage for this site in your browser's settings,
								however, this will delete all documents.
							</div>,
							error,
						});
					} else {
						this.showError({
							message: `Failed to save ${documentThatYouWereMaybeLeaving} into storage!`,
							error,
						});
					}
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
	saveDocumentAsPNG(serializedDocument) {
		const json = JSON.stringify(serializedDocument);
		const metadata = {
			Software: "Mopaint",
			"Mopaint Format Version": serializedDocument.formatVersion,
			"Creation Time": new Date().toUTCString(),
			"Program Source": json,
		};

		console.log("Save PNG with metadata", metadata);

		// TODO: get this in a more "legit" way
		const canvas = document.querySelector(".DrawingCanvas canvas");

		const verifyEncodedBlob = (
			encodedBlob,
			verifiedCallback,
			mismatchedCallback
		) => {
			const fileReader = new FileReader();
			fileReader.onload = () => {
				const arrayBuffer = fileReader.result;
				const uint8Array = new Uint8Array(arrayBuffer);
				const encodedMetadata = readMetadataSync(uint8Array);
				if (encodedMetadata["Program Source"] === json) {
					verifiedCallback();
				} else {
					mismatchedCallback();
				}
			};
			fileReader.readAsArrayBuffer(encodedBlob);
		};

		canvas.toBlob((rawImageBlob) => {
			injectMetadataIntoBlob(rawImageBlob, metadata, (pngramBlob) => {
				verifyEncodedBlob(
					pngramBlob,
					() => {
						// TODO: free object URL eventually
						const pngramBlobUrl = URL.createObjectURL(pngramBlob);
						// TODO: create a save dialog so a.click() can work consistently (on a user gesture), and so you can choose a file name
						const a = document.createElement("a");
						a.download = "Drawing.png";
						a.href = pngramBlobUrl;
						a.click();
						// this.showDialog({
						// 	message: <div>
						// 		Save as PNG and document/program hybrid!<br/>
						// 		<a href={pngramBlobUrl} download="Drawing.png">Save PNG Program</a><br/>
						// 	</div>,
						// });
					},
					() => {
						const programSourceBlob = new File(
							[JSON.stringify(serializedDocument)],
							"Drawing.mop",
							{
								type: "application/x-mopaint+json",
							}
						);
						// TODO: free object URLs eventually
						const rawImageBlobUrl = URL.createObjectURL(rawImageBlob);
						const programSourceBlobUrl = URL.createObjectURL(programSourceBlob);
						this.showError({
							message: (
								<div>
									Failed to save document as PNG program!
									<br />
									<a href={rawImageBlobUrl} download="Drawing (raw).png">
										Save Raw Image (.png)
									</a>
									<br />
									<a href={programSourceBlobUrl} download="Drawing.mop">
										Save Program Source (.mop)
									</a>
								</div>
							),
						});
					}
				);
			});
		}, "image/png");
	}
	loadDocumentFromJSON(json) {
		let serializedDocument;
		try {
			serializedDocument = JSON.parse(json);
		} catch (error) {
			this.showError({
				message: (
					<div>
						Failed to load as Mopaint document, invalid JSON
						<details>
							<summary>JSON</summary>
							<div className="actual-details">
								<pre>{json}</pre>
							</div>
						</details>
					</div>
				),
				error,
			});
			return;
		}
		this.props.loadNewDocument(serializedDocument);
	}
	handleDroppedOrOpenedFiles(files) {
		// TODO: progress indication
		const file = files[0];
		if (file) {
			const fileReader = new FileReader();
			fileReader.onload = () => {
				const arrayBuffer = fileReader.result;
				const uint8Array = new Uint8Array(arrayBuffer);
				if (isPNG(uint8Array)) {
					const metadata = readMetadataSync(uint8Array);
					const formatVersion = metadata["Mopaint Format Version"];
					if (formatVersion) {
						const json = metadata["Program Source"];
						this.loadDocumentFromJSON(json);
					} else {
						// TODO: handle plain image files
						this.showError({
							message:
								"Loading images is not supported yet (other than Mopaint PNG programs)",
						});
					}
				} else if (uint8Array[0] === "{".charCodeAt(0)) {
					const fileReader = new FileReader();
					fileReader.onload = () => {
						this.loadDocumentFromJSON(fileReader.result);
					};
					fileReader.readAsText(file);
					//	TODO: handle palette json files
				} else {
					// TODO: handle plain image files, Photoshop/GIMP/Paint.NET documents, etc.
					loadPalette(file, (error, palette) => {
						if (error) {
							this.showError({
								message: `Failed to load file as a color palette.`, // TODO: more generic message? uh? er? hm? uh...
								error,
							});
						} else {
							this.setState(
								{
									palette: palette.map((color) => color.toString()),
								},
								this.saveDebounced.bind(this)
							);
						}
					});
				}
			};
			fileReader.readAsArrayBuffer(file);
		}
	}
	openDocument() {
		const input = document.createElement("input");
		input.type = "file";
		input.style.display = "none";
		document.body.appendChild(input);
		// input.multiple = true; // TODO once opening multiple images is a thing
		input.addEventListener("change", () => {
			this.handleDroppedOrOpenedFiles(input.files);
			input.remove();
		});
		input.click();
	}
	componentDidMount() {
		this.load();

		window.addEventListener(
			"beforeunload",
			(this.beforeUnloadListener = (event) => {
				// This isn't the only time we save -- that would be a terrible pattern! you can't rely on any 'event' in a power outage or crash --
				// but it's good to have since there are places where we delay (i.e. debounce) saving for performance reasons
				// so if you made a change and then quickly closed or reloaded the page (by accident, and/or with auto reload in development),
				// it'll still save, and you won't lose anything. it's great. 🙂
				this.save(true);
			})
		);

		window.addEventListener(
			"keydown",
			(this.keyDownListener = (event) => {
				if (
					document.activeElement &&
					document.activeElement.matches("input, textarea")
				) {
					return;
				}
				// TODO: metaKey for mac
				if (event.ctrlKey) {
					if (event.key === "z") {
						this.undo();
					} else if (event.key === "Z" || event.key === "y") {
						this.redo();
					} else if (event.key === "s") {
						this.showSaveDialog();
					} else if (event.key === "o") {
						this.openDocument();
					} else {
						return; // don't prevent default
					}
				} else {
					return; // don't prevent default
				}
				event.preventDefault();
			})
		);

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
				this.handleDroppedOrOpenedFiles(e.dataTransfer.files);
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
		// TODO: make App component handle switching documents
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
		this.setState(
			{
				undos: undos.pop(),
				redos: redos.push(action),
			},
			this.saveDebounced.bind(this)
		);
	}
	redo() {
		const { undos, redos } = this.state;

		if (redos.size < 1) {
			return false;
		}

		const action = redos.last();
		this.setState(
			{
				undos: undos.push(action),
				redos: redos.pop(),
			},
			this.saveDebounced.bind(this)
		);
	}

	render() {
		const {
			selectedSwatch,
			selectedTool,
			palette,
			undos,
			dialogState,
		} = this.state;

		const selectSwatch = (swatch) => {
			this.setState({ selectedSwatch: swatch }, this.saveDebounced.bind(this));
		};
		const selectTool = (tool) => {
			this.setState({ selectedTool: tool }, this.saveDebounced.bind(this));
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
				this.setState(
					{
						undos: undos.slice(0, indexInUndos + 1),
						redos: redos.concat(actionsToUndo.reverse()),
					},
					this.saveDebounced.bind(this)
				);
				return;
			}
			if (indexInRedos > -1) {
				const actionsToRedo = redos.slice(indexInRedos, redos.size);
				this.setState(
					{
						undos: undos.concat(actionsToRedo.reverse()),
						redos: redos.slice(0, indexInRedos),
					},
					this.saveDebounced.bind(this)
				);
				return;
			}
			this.showError({
				message:
					"Something bad happened and somehow the entry wasn't found in undos or redos.",
				requestABugReport: true,
			});
		};

		return (
			<div className="App">
				<main>
					{/* prettier-ignore */}
					<Warning>
						⚠
						This app is in very early stages of development,
						and it doesn't represent the future vision for this project.
						See the <a href="https://github.com/1j01/mopaint#mopaint" target="_blank">README on GitHub for more info</a>.
					</Warning>
					<div id="documents-options">
						<label>
							Switch documents:&nbsp;
							<select
								value={this.props.documentID}
								onChange={(event) =>
									this.props.goToDocument(event.target.value)
								}
							>
								>
								{this.props.documentIDs.map((documentID) => {
									return (
										<option value={documentID} key={documentID}>
											Untitled ({documentID})
										</option>
									);
								})}
							</select>
						</label>
						<hr />
						<button
							id="new-document"
							className="toolbar-button"
							onClick={this.props.createNewDocument}
							aria-label="New Document"
							title="New Document"
						>
							<NewDocumentIcon width="48px" height="48px" />
						</button>
						<button
							id="save-document"
							className="toolbar-button"
							onClick={() => {
								this.showSaveDialog();
							}}
							aria-label="Save Document"
							title="Save Document"
						>
							<SaveDocumentIcon width="48px" height="48px" />
						</button>
						<button
							id="open-document"
							className="toolbar-button"
							onClick={() => {
								this.openDocument();
							}}
							aria-label="Open Document"
							title="Open Document"
						>
							<OpenDocumentIcon width="48px" height="48px" />
						</button>
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
				{dialogState && (
					<Dialog
						message={dialogState.message}
						error={dialogState.error}
						isError={dialogState.isError}
						requestABugReport={dialogState.requestABugReport}
						extraButtons={dialogState.extraButtons}
						buttons={dialogState.buttons}
						close={this.closeDialog.bind(this)}
					/>
				)}
			</div>
		);
	}
	showError(dialogState) {
		dialogState = { isError: true, ...dialogState };
		this.setState({ dialogState });
	}
	showMessage(dialogState) {
		dialogState = { isError: false, ...dialogState };
		this.setState({ dialogState });
	}
	closeDialog() {
		this.setState({ dialogState: null });
	}
	showSaveDialog() {
		let name = "Drawing";
		class SaveDialog extends Component {
			constructor() {
				super();
				this.inputRef = React.createRef();
			}
			render() {
				return (
					<div className="save-dialog-message">
						<form className="save-dialog-form">
							<label>
								Name:{" "}
								<input
									type="text"
									value={name}
									autoFocus={true}
									onChange={(event) => {
										name = event.target.value;
										this.setState({ a: "b" });
									}}
									ref={this.inputRef}
								/>
							</label>
						</form>
						<p style={{ maxWidth: 500 }}>
							This will save a hybrid file which can be shared as an image but
							also loaded back into Mopaint with all document history.
						</p>
					</div>
				);
			}
			componentDidMount() {
				this.inputRef.current.select();
			}
		}
		this.showMessage({
			message: <SaveDialog />,
			extraButtons: (
				<button
					onClick={() => {
						this.saveDocumentAsPNG(this.serializeDocument());
						this.closeDialog();
					}}
				>
					Save
				</button>
			),
		});
	}
}

App.propTypes = {
	documentID: PropTypes.string.isRequired,
	documentIDs: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
	goToDocument: PropTypes.func.isRequired,
	createNewDocument: PropTypes.func.isRequired,
	loadNewDocument: PropTypes.func.isRequired,
	serializedDocumentToLoad: PropTypes.object,
};

export default App;
