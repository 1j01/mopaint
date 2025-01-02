// import { loadPalette } from "anypalette";
import { List } from "immutable";
import isPNG from "is-png";
import localforage from "localforage";
import PropTypes from "prop-types";
import React, { Component, useEffect, useRef, useState } from "react";
import HistoryNode from "../HistoryNode.js";
import defaultPalette, { defaultColor } from "../default-palette.js";
import { deserializeDocument, serializeDocument } from "../document-format";
import { goToHistoryNode, redo, undo } from "../history.js";
import { ReactComponent as NewDocumentIcon } from "../icons/small-n-flat/document-new-importable.svg";
import { ReactComponent as OpenDocumentIcon } from "../icons/small-n-flat/document-open-importable.svg";
import { ReactComponent as SaveDocumentIcon } from "../icons/small-n-flat/document-save-importable.svg";
import { ReactComponent as PickDocumentIcon } from "../icons/small-n-flat/file-picture-multiple-importable.svg";
import { injectMetadataIntoBlob, readMetadataSync } from "../png-metadata.js";
import tools, { toolsByName } from "../tools";
import "./App.css";
import Colorbox from "./Colorbox.jsx";
import DarkModeToggle from "./DarkModeToggle.jsx";
import Dialog from "./Dialog.jsx";
import DocumentPickerDialog from "./DocumentPickerDialog.jsx";
import DrawingCanvas from "./DrawingCanvas.jsx";
import HistoryView from "./HistoryView.jsx";
import LoadingIndicator from "./LoadingIndicator.jsx";
import Toolbox from "./Toolbox.jsx";
import Warning from "./Warning.jsx";

const getToolByName = (toolID) => {
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
			palette: defaultPalette, // Eventually, the palette could be more like just part of the document,
			// and more dynamic (gradients and patterns),
			// and could be shared with other documents the same way(s) as tools should be able to be
			// (and images could be used as palettes by sampling from them)
			selectedSwatch: defaultColor,
			selectedTool: getToolByName("Freeform Line"),
			undos: new List(),
			redos: new List(),
			currentHistoryNode: new HistoryNode({ name: "New Document" }),
			loaded: false,
			loadFailed: false,
		};

		// Eventually, thumbnails should be part of the computation graph
		this.thumbnailsByOperation = new Map();

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
			errorInfo = {
				message: "Failed to load document!",
				error,
			};
		}
		if (errorInfo) {
			this.showError(errorInfo);
			this.setState({ loadFailed: true });
		} else {
			stateUpdates.loaded = true;
			this.setState(stateUpdates, () => {
				console.log(`Loaded ${this.props.documentID}`);

				// Use case 1: older documents saved before thumbnails were stored
				// Use case 2: saving the thumbnail could have failed due to quota limits previously, and space is now freed up
				localforage.getItem(`document:${this.props.documentID}:thumbnail`).then((thumbnailBlob) => {
					if (!thumbnailBlob) {
						requestAnimationFrame(() => {
							this.saveThumbnail();
						});
					}
				});
			});
		}
	}

	load() {
		if (!this.props.documentID) {
			console.log("No document ID to load");
			return;
		}
		console.log(`Load ${this.props.documentID}`);
		const { serializedDocumentToLoad } = this.props;
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
				if (serializedDocumentToLoad) {
					if (!serialized) {
						this.loadSerializedDocument(serializedDocumentToLoad);
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
					message: `The document ${this.state.loadFailed ? "failed to load" : "hasn't loaded yet"}. Start a new document?`,
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
				// error = new Error("EMIT"); error.name = "QuotaExceededError";
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
								<br /><br />
								Check that your computer has enough disk space.
								<br /><br />
								If you have enough free space, we’ve run out of space as allowed by the browser per site.
								You could free up quota by clearing the storage for this site in your browser’s settings,
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
								<br /><br />
								Ran out of space allowed by the browser.
								You could free up quota by clearing the storage for this site in your browser’s settings,
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
						`Saved ${this.props.documentID}${leavingThisDocument ? " (leaving it)" : ""}`,
					);
					this.saveThumbnail();
				}
			},
		);
	}

	saveThumbnail() {

		// TODO: get this in a more "legit" way, like with refs
		const canvas = document.querySelector(".DrawingCanvas canvas");

		const aspectRatio = canvas.width / canvas.height;
		const thumbnailCanvas = document.createElement("canvas");
		thumbnailCanvas.width = Math.min(100, canvas.width, canvas.height * aspectRatio);
		thumbnailCanvas.height = thumbnailCanvas.width / aspectRatio;
		thumbnailCanvas.getContext("2d").drawImage(canvas, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
		thumbnailCanvas.toBlob((thumbnailBlob) => {
			localforage.setItem(
				`document:${this.props.documentID}:thumbnail`,
				thumbnailBlob,
				(/*error*/) => {
					// TODO: handle error?
				}
			);
		});
	}

	createPNGram(serializedDocument, callback, mismatchedCallback, errorCallback) {
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
			encodedBlob.arrayBuffer().then((arrayBuffer) => {
				const uint8Array = new Uint8Array(arrayBuffer);
				const encodedMetadata = readMetadataSync(uint8Array);
				if (encodedMetadata["Program Source"] === json) {
					verifiedCallback();
				} else {
					mismatchedCallback();
				}
			}, (error) => {
				errorCallback(error);
			});
		};

		this.createRawPNG((rawImageBlob) => {
			injectMetadataIntoBlob(rawImageBlob, metadata, (error, pngramBlob) => {
				if (error) {
					return errorCallback(error);
				}
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

	loadDocumentFromJSON(json, fileName, fileIsSomethingElseCallback) {
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
		if (serializedDocument.format !== "mopaint") {
			if (fileIsSomethingElseCallback) {
				fileIsSomethingElseCallback(serializedDocument);
			} else {
				this.showError({
					message: "This is not a Mopaint document."
				});
			}
			return;
		}
		this.props.loadNewDocument(serializedDocument, fileName);
	}

	handleDroppedOrOpenedFiles(files) {
		const tryPalette = (file) => {
			// loadPalette(file, (error, palette) => {
			// 	if (error) {
			// 		this.showError({
			// 			message: "This does not appear to be a Mopaint file or color palette.",
			// 			error, // @TODO: instead of generic error display,
			// 			// list the formats that were tried in a nice way, including non-palette formats,
			// 			// with palette formats as a group
			// 		});
			// 	} else {
			// 		this.setState(
			// 			{
			// 				palette: palette.map((color) => color.toString()),
			// 			},
			// 			this.saveDebounced.bind(this),
			// 		);
			// 	}
			// });
		};

		// TODO: progress indication
		const file = files[0];
		if (file) {
			file.arrayBuffer().then((arrayBuffer) => {
				const uint8Array = new Uint8Array(arrayBuffer);
				if (isPNG(uint8Array)) {
					const metadata = readMetadataSync(uint8Array);
					const formatVersion = metadata["Mopaint Format Version"];
					if (formatVersion) {
						const json = metadata["Program Source"];
						this.loadDocumentFromJSON(json, file.name);
					} else {
						// TODO: handle plain image files
						this.showError({
							message:
								"Loading images is not supported yet (other than Mopaint PNG programs)",
						});
					}
				} else if (uint8Array[0] === "{".charCodeAt(0)) {
					file.text().then((text) => {
						this.loadDocumentFromJSON(text, file.name, () => {
							tryPalette(file);
						});
					}, (error) => {
						this.showError({ error });
					});
				} else {
					// TODO: handle plain image files, Photoshop/GIMP/Paint.NET documents, etc.
					tryPalette(file);
				}
			}, (error) => {
				this.showError({ error });
			});
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
			(this.beforeUnloadListener = () => {
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
				if (event.key === "Escape") {
					this.closeDialog();
					return;
				}
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
					} else if (event.key === "s" || event.key === "S") { // Save and Save As shortcuts same for now
						this.showSaveDialog();
					} else if (event.key === "o") {
						this.openDocument();
					} else if (event.key === "a") {
						this.drawingCanvasComponent.selectAll();
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

	UNSAFE_componentWillReceiveProps(nextProps) {
		console.assert(
			nextProps.documentID === this.props.documentID,
			"App component is not designed to handle switching documents without reconstruction",
		);
		// TODO: make App component handle switching documents
	}

	// TODO: collaborative sync with undo/redo, showing operations from other users in realtime
	// Note: should be able to support time-based tools in a reproducible way
	// with timestamps and periodic updates to the latest timestamp value
	// and support pseudorandomness by seeding from operation ID
	// TODO: move this state manipulation stuff out of the component
	addOperation(operation) {

		let { currentHistoryNode, undos, redos } = this.state;

		redos = new List();
		undos = undos.push(currentHistoryNode);

		const newHistoryNode = new HistoryNode({
			parentNode: currentHistoryNode,
			name: operation.tool.name,
			operation,
		});
		currentHistoryNode.childNodes.push(newHistoryNode);
		currentHistoryNode = newHistoryNode;

		this.setState(
			{
				currentHistoryNode: currentHistoryNode,
				undos: undos,
				redos: redos,
			},
			this.save.bind(this),
		);
	}

	updateOperation(/*operation*/) {
		// TODO: immutable operation objects probably (immutable.js has a Record class, I could use that)
		// or append-only operation state?
		// TODO: soft undo/redo / fundo/freedo / sliding/gliding/partial undo/redo

		// (this is just to generically trigger an update)
		this.setState({ currentHistoryNode: this.state.currentHistoryNode }, this.saveDebounced.bind(this));
	}

	undo() {
		const { currentHistoryNode, undos, redos } = this.state;

		const newState = undo({ currentHistoryNode, undos, redos });
		this.setState(
			{
				currentHistoryNode: newState.currentHistoryNode,
				undos: newState.undos,
				redos: newState.redos,
			},
			this.saveDebounced.bind(this),
		);
		this.drawingCanvasComponent.deselect();
	}

	redo() {
		const { currentHistoryNode, undos, redos } = this.state;

		const newState = redo({ currentHistoryNode, undos, redos });
		this.setState(
			{
				currentHistoryNode: newState.currentHistoryNode,
				undos: newState.undos,
				redos: newState.redos,
			},
			this.saveDebounced.bind(this),
		);
		this.drawingCanvasComponent.deselect();
	}

	goToHistoryNode(targetHistoryNode) {
		const { currentHistoryNode, undos, redos } = this.state;

		const newState = goToHistoryNode(targetHistoryNode, { currentHistoryNode, undos, redos });
		this.setState(
			{
				currentHistoryNode: newState.currentHistoryNode,
				undos: newState.undos,
				redos: newState.redos,
			},
			this.saveDebounced.bind(this),
		);
		this.drawingCanvasComponent.deselect();
	}

	render() {
		const { selectedSwatch, selectedTool, palette, currentHistoryNode, dialog } = this.state;

		const selectSwatch = (swatch) => {
			this.setState({ selectedSwatch: swatch }, this.saveDebounced.bind(this));
		};
		const selectTool = (tool) => {
			this.setState({ selectedTool: tool }, this.saveDebounced.bind(this));
		};

		const operations = [];
		const collectOperations = (historyNode) => {
			if (historyNode.operation) {
				operations.push(historyNode.operation);
			}
			while (historyNode.parentNode) {
				historyNode = historyNode.parentNode;
				if (historyNode.operation) {
					operations.push(historyNode.operation);
				}
			}
			operations.reverse();
		};
		collectOperations(currentHistoryNode);

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
						<button
							id="show-document-picker"
							className="toolbar-button"
							onClick={() => {
								this.showChooseDocumentDialog();
							}}
							aria-label="Show Documents"
							title="Show Documents"
						>
							<PickDocumentIcon width="48px" height="48px" />
						</button>
						<div style={{ flex: 1 }} />
						<DarkModeToggle />
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
						loaded={this.state.loaded || this.state.loadFailed /* might want these separate eventually */}
						selectedSwatch={selectedSwatch}
						selectedTool={selectedTool}
						documentContext={this.documentContext}
						addOperation={this.addOperation.bind(this)}
						updateOperation={this.updateOperation.bind(this)}
						operations={operations}
						thumbnailsByOperation={this.thumbnailsByOperation}
						ref={(component) => {
							this.drawingCanvasComponent = component;
						}}
					/>
				</main>
				{/* TODO: resizable sidebar */}
				<div className="sidebar">
					<HistoryView
						loaded={this.state.loaded || this.state.loadFailed /* might want these separate eventually */}
						currentHistoryNode={this.state.currentHistoryNode}
						undos={this.state.undos}
						redos={this.state.redos}
						goToHistoryNode={this.goToHistoryNode.bind(this)}
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

	showChooseDocumentDialog() {
		const closeDialog = this.closeDialog.bind(this);
		this.showDialog(<DocumentPickerDialog close={closeDialog} currentDocumentID={this.props.documentID} />);
	}

	showSaveDialog() {
		// Can't use showError generally here, as only a single dialog is supported as of writing,
		// so it would replace the save dialog making it impossible to save.
		/* eslint no-restricted-syntax: ["error", "CallExpression[callee.name='showError']"] */
		const { documentID } = this.props;
		const createPNGram = this.createPNGram.bind(this);
		const createRawPNG = this.createRawPNG.bind(this);
		const closeDialog = this.closeDialog.bind(this);
		const showErrorReplacingSaveDialog = this.showError.bind(this);
		const state = this.state;

		const a = document.createElement("a");
		a.className = "for-downloading-files";
		a.tabIndex = -1;
		document.body.appendChild(a);

		function SaveDialog(props) {
			const [saveType, setSaveType] = useState("hybrid");
			const [name, setName] = useState(props.defaultName);
			const [blobUrl, setBlobUrlWithoutRevokingOld] = useState(null);
			const [hybridFailed, setHybridFailed] = useState(false);

			const revokeOldAndSetBlobUrl = (newBlobUrl) => {
				setBlobUrlWithoutRevokingOld((oldBlobUrl) => {
					URL.revokeObjectURL(oldBlobUrl);
					return newBlobUrl;
				});
			};
			const onHybridFailed = () => {
				setHybridFailed(true);
				setSaveType("program");
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

				localforage.setItem(
					`document:${documentID}:name`,
					name,
					(/*error*/) => {
						// TODO: handle error?
					}
				);
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
						// Failed to save hybrid document. It's probably too large.
						// @TODO: would it help to create PNG with UPNG.js?
						onHybridFailed();
					}, (/*error*/) => {
						// alert("Failed to save hybrid document - try the other save options.\n\n"+error);
						onHybridFailed();
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
					// eslint-disable-next-line no-restricted-syntax
					showErrorReplacingSaveDialog({ message: `This shouldn't happen, saveType=${saveType}`, requestBugReport: true });
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
										<option value="hybrid">{hybridFailed ? "⚠️ " : ""}Hybrid Mopaint Document and Image (.png)</option>
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
							{!blobUrl ? <LoadingIndicator /> : null}
							Save
						</button>
					}
				/>
			);
		}

		localforage.getItem(`document:${documentID}:name`).then((name) => {
			this.showDialog(<SaveDialog defaultName={name || "Drawing"} />);
		}, (/*error*/) => {
			this.showDialog(<SaveDialog defaultName="Drawing" />);
		});
		/* eslint no-restricted-syntax: ["off"] */
	}
}

App.propTypes = {
	documentID: PropTypes.string.isRequired,
	goToDocument: PropTypes.func.isRequired,
	createNewDocument: PropTypes.func.isRequired,
	loadNewDocument: PropTypes.func.isRequired,
	serializedDocumentToLoad: PropTypes.object,
};

export default App;
