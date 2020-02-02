import localforage from "localforage";
import { List } from "immutable";
import React, { Component, useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import { load as loadPalette } from "anypalette";
import isPNG from "is-png";
import { injectMetadataIntoBlob, readMetadataSync } from "../png-metadata.js";
import { serializeDocument, deserializeDocument } from "../document-format"; 
import tools, { toolsByName } from "../tools";
import DrawingCanvas from "./DrawingCanvas.js";
import Toolbox from "./Toolbox.js";
import Colorbox from "./Colorbox.js";
import HistoryView from "./HistoryView.js";
import Dialog from "./Dialog.js";
import Warning from "./Warning.js";
import defaultPalette from "../db32-palette.js";
import "./App.css";
import { ReactComponent as NewDocumentIcon } from "../icons/small-n-flat/document-new-importable.svg";
import { ReactComponent as OpenDocumentIcon } from "../icons/small-n-flat/document-open-importable.svg";
import { ReactComponent as SaveDocumentIcon } from "../icons/small-n-flat/document-save-importable.svg";

const getToolByName = (toolID)=> {
	const tool = toolsByName[toolID];
	if (!tool) {
		throw new Error(`Tool not found with name '${toolID}'`);
	}
	return tool;
};

class App extends Component {
	constructor(props) {
		super(props);
		// TODO: move state outside of the component
		this.state = {
			palette: defaultPalette, // TODO: eventually probably remove the "palette" state as a concept;
			// I don't think this feature is special enough to warrant special handling (except for parsing palette files)
			// It can be part of the document, and more dynamic (gradients and patterns),
			// and could be shared with other documents the same way(s) as tools should be able to be
			// (and images could be used as palettes by sampling from them)
			selectedSwatch: defaultPalette[0],
			selectedTool: getToolByName("Freeform Line"),
			undos: new List(),
			redos: new List(),
			// operations: new List(),
			loaded: false,
			loadFailed: false,
		};

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
		let errorInfo, stateUpdates;
		try {
			[errorInfo, stateUpdates] = deserializeDocument(serialized, fromFile, getToolByName);
		} catch (error) {
			this.showError({
				message: "Failed to load document!",
				error,
			});
			this.setState({ loadFailed: true });
		}
		if (errorInfo) {
			this.showError(errorInfo);
			this.setState({ loadFailed: true });
		} else {
			stateUpdates.loaded = true;
			this.setState(stateUpdates, () => {
				console.log(`Loaded ${this.props.documentID}`);
			});
		}
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
							requestBugReport: true,
						});
					}
					return;
				}
				if (!serialized) {
					this.setState({ loaded: true });
					console.log(
						`State loaded as empty for document:${this.props.documentID}:state`,
					);
					return;
				}
				console.log(`Loaded data for ${this.props.documentID}`);
				this.loadSerializedDocument(serialized);
			},
		);
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
		const serialized = serializeDocument(this.state);
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
						}`,
					);
				}
			},
		);
	}

	createPNGram(serializedDocument, callback, mismatchedCallback) {
		const json = JSON.stringify(serializedDocument);
		const metadata = {
			"Software": "Mopaint",
			"Mopaint Format Version": serializedDocument.formatVersion,
			"Creation Time": new Date().toUTCString(),
			"Program Source": json,
		};

		console.log("Save PNG with metadata", metadata);

		const verifyEncodedBlob = (
			encodedBlob,
			verifiedCallback,
			mismatchedCallback,
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

		this.createRawPNG((rawImageBlob) => {
			injectMetadataIntoBlob(rawImageBlob, metadata, (pngramBlob) => {
				verifyEncodedBlob(
					pngramBlob,
					() => {
						callback(pngramBlob);
					},
					() => {
						mismatchedCallback();
					},
				);
			});
		});
	}

	createRawPNG(callback) {
		// TODO: get this in a more "legit" way (i.e. refs)
		const canvas = document.querySelector(".DrawingCanvas canvas");

		canvas.toBlob(callback, "image/png");
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
					// TODO: handle palette json files
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
								this.saveDebounced.bind(this),
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
			}),
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
			}),
		);

		window.addEventListener(
			"dragover",
			(this.dragOverListener = (e) => {
				e.preventDefault();
			}),
		);
		window.addEventListener(
			"drop",
			(this.dropListener = (e) => {
				e.preventDefault();
				this.handleDroppedOrOpenedFiles(e.dataTransfer.files);
			}),
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
			"App component is not designed to handle switching documents without reconstruction",
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
			this.save.bind(this),
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
			this.saveDebounced.bind(this),
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
			this.saveDebounced.bind(this),
		);
	}

	render() {
		const { selectedSwatch, selectedTool, palette, undos, dialog } = this.state;

		const selectSwatch = (swatch) => {
			this.setState({ selectedSwatch: swatch }, this.saveDebounced.bind(this));
		};
		const selectTool = (tool) => {
			this.setState({ selectedTool: tool }, this.saveDebounced.bind(this));
		};

		const goToEntry = (entry) => {
			const { undos, redos } = this.state;
			const indexInUndos = undos.indexOf(entry);
			const indexInRedos = redos.indexOf(entry);
			const isCurrent = entry === undos.last();
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
					this.saveDebounced.bind(this),
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
					this.saveDebounced.bind(this),
				);
				return;
			}
			this.showError({
				message:
					"Something bad happened and somehow the entry wasn't found in undos or redos.",
				requestBugReport: true,
			});
		};

		return (
			<div className="App">
				<main>
					<Warning>
						⚠ This app is in very early stages of development. There are Big Plans.
						See the <a href="https://github.com/1j01/mopaint#mopaint" target="_blank" rel="noopener noreferrer">
							README on GitHub for more info
						</a>.
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
						<hr/>
						<button
							id="new-document"
							className="toolbar-button"
							onClick={this.props.createNewDocument}
							aria-label="New Document"
							title="New Document"
						>
							<NewDocumentIcon width="48px" height="48px"/>
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
							<SaveDocumentIcon width="48px" height="48px"/>
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
							<OpenDocumentIcon width="48px" height="48px"/>
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
				{dialog}
			</div>
		);
	}

	showError(dialogState) {
		dialogState = { isError: true, ...dialogState };
		if (window.console && dialogState.error) {
			console.error("(Error details:)", dialogState.error);
		}
		this.showMessage(dialogState);
	}

	showMessage(dialogState) {
		this.showDialog(
			<Dialog
				message={dialogState.message}
				error={dialogState.error}
				isError={dialogState.isError}
				requestBugReport={dialogState.requestBugReport}
				extraButtons={dialogState.extraButtons}
				buttons={dialogState.buttons}
				close={this.closeDialog.bind(this)}
			/>,
		);
	}

	showDialog(dialog) {
		this.setState({ dialog });
	}

	closeDialog() {
		this.setState({ dialog: null });
	}

	showSaveDialog() {
		const createPNGram = this.createPNGram.bind(this);
		const createRawPNG = this.createRawPNG.bind(this);
		const closeDialog = this.closeDialog.bind(this);
		const showError = this.showError.bind(this);
		const state = this.state;

		const a = document.createElement("a");
		a.className = "for-downloading-files";
		a.tabIndex = -1;
		document.body.appendChild(a);

		function SaveDialog() {
			const [saveType, setSaveType] = useState("hybrid");
			const [name, setName] = useState("Drawing");
			const [blobUrl, setBlobUrlWithoutRevokingOld] = useState(null);
			const revokeOldAndSetBlobUrl = (newBlobUrl)=> {
				setBlobUrlWithoutRevokingOld((oldBlobUrl)=> {
					URL.revokeObjectURL(oldBlobUrl);
					return newBlobUrl;
				});
			};
			const inputRef = useRef(null);

			const fileExt = {
				"hybrid": "png",
				"raw-image": "png",
				"program": "mop",
			}[saveType];
			const fileName = name.replace(new RegExp("\\." + fileExt + "$", "i"), "") + "." + fileExt;

			const saveFileAndCloseDialog = () => {
				a.download = fileName;
				a.href = blobUrl;
				console.log("Download", blobUrl);
				a.click();
				closeDialog();
			};

			useEffect(() => {
				inputRef.current.select();
			}, []);

			useEffect(() => {
				return () => {
					revokeOldAndSetBlobUrl(null);
					a.remove();
				};
			}, []);

			useEffect(() => {
				revokeOldAndSetBlobUrl(null);
				if (saveType === "hybrid") {
					const serializedDocument = serializeDocument(state);
					createPNGram(serializedDocument, (pngramBlob) => {
						const pngramBlobUrl = URL.createObjectURL(pngramBlob);
						revokeOldAndSetBlobUrl(pngramBlobUrl);
					}, () => {
						alert("Failed to save hybrid document (probably too large) - try the other save options.");
					});
				} else if (saveType === "raw-image") {
					createRawPNG((rawPngBlob) => {
						const rawPngBlobUrl = URL.createObjectURL(rawPngBlob);
						revokeOldAndSetBlobUrl(rawPngBlobUrl);
					});
				} else if (saveType === "program") {
					const serializedDocument = serializeDocument(state);
					const programSourceBlob = new Blob(
						[JSON.stringify(serializedDocument)],
						{
							type: "application/x-mopaint+json",
						},
					);
					const programBlobUrl = URL.createObjectURL(programSourceBlob);
					revokeOldAndSetBlobUrl(programBlobUrl);
				} else {
					showError({ message: `This shouldn't happen, saveType=${saveType}`, requestBugReport: true });
				}
			}, [saveType]);

			return (
				<Dialog
					message={
						<div className="save-dialog-message">
							<form
								className="save-dialog-form"
								onSubmit={(event) => {
									event.preventDefault();
									saveFileAndCloseDialog();
								}}
							>
								<label>
									Name:{" "}
									<input
										type="text"
										value={name}
										autoFocus={true}
										onChange={(event) => {
											setName(event.target.value);
										}}
										ref={inputRef}
									/>
								</label>
								<div style={{ marginTop: "1em" }}>
									<select
										value={saveType}
										onChange={(event) => setSaveType(event.target.value)}
									>
										<option value="hybrid">Hybrid Mopaint Document and Image (.png)</option>
										<option value="program">Mopaint Document (.mop)</option>
										<option value="raw-image">Raw Image (.png)</option>
										{/*<option value="hybrid">Hybrid Mopaint Program and Image (.png)</option>*/}
										{/*<option value="program">Mopaint Program (.mop)</option>*/}
										{/*<option value="raw-image">Raw/Plain Dead Fish Image (.png)</option>*/}
									</select>
								</div>
							</form>
						</div>
					}
					close={closeDialog}
					extraButtons={
						<button
							onClick={saveFileAndCloseDialog}
							disabled={!blobUrl}
						>
							{/* TODO: loading spinner instead */}
							Save {!blobUrl ? "(please wait...)" : ""}
						</button>
					}
				/>
			);
		}

		this.showDialog(<SaveDialog/>);
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
