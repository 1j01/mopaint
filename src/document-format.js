import React from "react";
import { List } from "immutable";
import HistoryNode from "./HistoryNode";
import {generateID} from "./helpers.js";
import {getRoot} from "./history.js";

export const CURRENT_SERIALIZATION_VERSION = 0.4;

export function serializeDocument({palette, selectedSwatch, selectedTool, undos, redos, currentHistoryNode}) {
	// TODO: serialize tools as code (+ identifiers), and create a sandbox?

	const serializeOperation = (operation) => {
		return {
			id: operation.id,
			toolID: operation.tool.name,
			points: operation.points,
			swatch: operation.swatch,
		};
	};

	// TODO: DRY
	const rootHistoryNode = getRoot(currentHistoryNode);
	const allHistoryNodes = [];
	const collectNodes = (node)=> {
		for (const subNode of node.futures) {
			collectNodes(subNode);
		}
		allHistoryNodes.push(node);
	};
	collectNodes(rootHistoryNode);
	allHistoryNodes.sort((a, b)=> {
		if (a.timestamp < b.timestamp) {
			return -1;
		}
		if (b.timestamp < a.timestamp) {
			return +1;
		}
		return 0;
	});

	const toID = (historyNode)=> historyNode.id;

	const historyNodesByID = {};
	allHistoryNodes.forEach((historyNode)=> {
		historyNodesByID[historyNode.id] = {
			parentHNID: historyNode.parentNode && historyNode.parentNode.id,
			childHNIDs: historyNode.futures.map(toID),
			timestamp: historyNode.timestamp,
			operation: historyNode.operation && serializeOperation(historyNode.operation),
			name: historyNode.name,
			id: historyNode.id,
		};
	});

	return {
		format: "mopaint",
		formatVersion: CURRENT_SERIALIZATION_VERSION,
		palette: palette,
		selectedSwatch: selectedSwatch,
		selectedToolID: selectedTool.name,
		historyNodesByID,
		undoHNIDs: undos.toJS().map(toID),
		redoHNIDs: redos.toJS().map(toID),
		currentHNID: toID(currentHistoryNode),
	};
}

export function deserializeDocument(serialized, isFromFile, getToolByName) {
	const nounPhraseThingToLoad = isFromFile ? "document" : "document state";
	if (serialized.format !== "mopaint") {
		return [{
			message: `Can't load ${nounPhraseThingToLoad} - it does not appear to be a Mopaint document`,
		}];
	}
	if (
		typeof serialized.formatVersion !== "number" ||
		serialized.formatVersion > CURRENT_SERIALIZATION_VERSION
	) {
		return [{
			message: `Can't load ${nounPhraseThingToLoad} created by later version of the app`,
		}];
	}
	const MINIMUM_LOADABLE_VERSION = 0.1;
	// upgrading code can go here, incrementing the version number step by step
	// e.g.
	// if (serialized.formatVersion === 0.01) {
	// 	serialized.newPropName = serialized.oldName;
	// 	delete serialized.oldName;
	// 	serialized.formatVersion = 0.02;
	// }
	if (serialized.formatVersion === 0.1) {
		// just skip over version 0.2, which was a dead end
		serialized.formatVersion = 0.3;
	}
	if (serialized.formatVersion === 0.3) {
		serialized.formatVersion = 0.4;
		// Convert to Non-Linear History
		// 
		// linear undos/redos -> tree of nodes
		// operations -> nodes containing operations
		// last "undo" -> current history node
		// 
		// necessary lies:
		// - time (previously not recorded)
		// - document structure (previously not recorded / already a lie)
		//
		// History nodes are to be serialized at this point as:
		// {parentHNID, childHNIDs, timestamp, operation, name, id}

		const baseTimestamp = +new Date('January 1, 2020 00:00:00');
		const rootHistoryNode = {
			name: "New Document",
			id: generateID(),
			childHNIDs: [],
			timestamp: baseTimestamp,
		};

		const historyNodesByID = {};
		historyNodesByID[rootHistoryNode.id] = rootHistoryNode;

		const opToHN = new Map();
		const makeFreeFloatingHN = (op)=> {
			const id = generateID();
			historyNodesByID[id] = {
				id,
				operation: op,
				name: op.toolID,
				parentHNID: undefined,
				childHNIDs: [],
				timestamp: baseTimestamp,
			};
			opToHN.set(op, historyNodesByID[id]);
		};
		serialized.undos.forEach(makeFreeFloatingHN);
		serialized.redos.forEach(makeFreeFloatingHN);

		let currentHNID;
		const undoHNIDs = [];
		const redoHNIDs = [];
		const linkHNs = (parentHN, childHN)=> {
			if (parentHN) {
				parentHN.childHNIDs.push(childHN.id);
				childHN.parentHNID = parentHN.id;
			}
		};
		
		const orderedOps = [
			...serialized.undos,
			...[...serialized.redos].reverse(),
		];
		const orderedHNs = [
			rootHistoryNode,
			...orderedOps.map((op)=> opToHN.get(op)),
		];
		orderedHNs.forEach((historyNode, index, orderedHNs)=> {
			const previousHistoryNode = orderedHNs[index - 1];
			if (previousHistoryNode) {
				linkHNs(previousHistoryNode, historyNode);
			}
			// TODO: update the history view's sort to work structurally when timestamps are equal
			historyNode.timestamp += index;
		});

		undoHNIDs.push(rootHistoryNode.id);
		orderedOps.forEach((op)=> {
			const historyNode = opToHN.get(op);
			if (op === serialized.undos[serialized.undos.length - 1]) {
				currentHNID = historyNode.id;
			} else if (serialized.redos.indexOf(op) > -1) {
				redoHNIDs.push(historyNode.id);
			} else {
				undoHNIDs.push(historyNode.id);
			}
		});

		serialized.historyNodesByID = historyNodesByID;
		serialized.currentHNID = currentHNID;
		serialized.undoHNIDs = undoHNIDs;
		serialized.redoHNIDs = redoHNIDs;

		delete serialized.undos;
		delete serialized.redos;
	}
	if (serialized.formatVersion < CURRENT_SERIALIZATION_VERSION) {
		const gitBranchName = `format-version-${serialized.formatVersion}`;
		return [{
			message: <React.Fragment>
				<p>
					Can't load {nounPhraseThingToLoad} created by old version of the app; there's no upgrade path from format version {
						serialized.formatVersion
					} to {CURRENT_SERIALIZATION_VERSION}{
						MINIMUM_LOADABLE_VERSION !== CURRENT_SERIALIZATION_VERSION
							? ` (minimum loadable: ${MINIMUM_LOADABLE_VERSION})`
							: ""
					}
				</p>
				<p>
					To load this {nounPhraseThingToLoad}, use the version of Mopaint at the Git branch&nbsp;
					<a href={`https://github.com/1j01/mopaint/tree/${gitBranchName}`} style={{fontFamily: "monospace"}}>{gitBranchName}</a>
				</p>
			</React.Fragment>
		}];
	}

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
			`on operation with ID ${serializedOperation.id}`,
		);
		const tool = getToolByName(serializedOperation.toolID);
		return {
			id: serializedOperation.id,
			tool: tool,
			points: serializedOperation.points,
			swatch: serializedOperation.swatch,
		};
	};
	expectPropertiesToExist(
		["palette", "selectedSwatch", "selectedToolID", "undoHNIDs", "redoHNIDs", "currentHNID", "historyNodesByID"],
		serialized,
		"on the root document object",
	);
	const historyNodesByID = {};
	for (const [historyNodeID, historyNodeData] of Object.entries(serialized.historyNodesByID)) {
		historyNodesByID[historyNodeID] = new HistoryNode(historyNodeData);
		if (historyNodeData.operation) {
			historyNodesByID[historyNodeID].operation = deserializeOperation(historyNodeData.operation);
		}
	}
	const fromHNID = (historyNodeID)=> historyNodesByID[historyNodeID];
	for (const [historyNodeID, historyNodeData] of Object.entries(serialized.historyNodesByID)) {
		historyNodesByID[historyNodeID].parentNode = historyNodesByID[historyNodeData.parentHNID];
		historyNodesByID[historyNodeID].futures = historyNodeData.childHNIDs.map(fromHNID);
	}
	return [null, {
		palette: serialized.palette,
		selectedSwatch: serialized.selectedSwatch,
		selectedTool: getToolByName(serialized.selectedToolID),
		undos: new List(serialized.undoHNIDs.map(fromHNID)),
		redos: new List(serialized.redoHNIDs.map(fromHNID)),
		currentHistoryNode: fromHNID(serialized.currentHNID),
	}];
}
