import React from "react";
import { List } from "immutable";

export const CURRENT_SERIALIZATION_VERSION = 0.4;

// TODO: DRY
const getRoot = (historyNode)=> {
	while (historyNode.parentNode) {
		historyNode = historyNode.parentNode;
	}
	return historyNode;
};

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
	allHistoryNodes.map((historyNode)=> {
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
	const MINIMUM_LOADABLE_VERSION = 0.4;
	// upgrading code can go here, incrementing the version number step by step
	// e.g.
	// if (serialized.formatVersion === 0.2) {
	// 	serialized.newPropName = serialized.oldName;
	// 	delete serialized.oldName;
	// 	serialized.formatVersion = 0.3;
	// }
	if (serialized.formatVersion === 0.1) {
		// literally no change afaik, just internals
		// just skipping over version 0.2, which was a dead end
		serialized.formatVersion = 0.3;
	}
	// if (serialized.formatVersion === 0.3) {

	// 	const rootHistoryNode = ...;
	// 	for (undos, redos...) {

	// 	}

	// 	serialized.formatVersion = 0.4;
	// }
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
		["palette", "selectedSwatch", "selectedToolID", "undos", "redos", "currentHistoryNodeID"],
		serialized,
		"on the root document object",
	);
	return [null, {
		palette: serialized.palette,
		selectedSwatch: serialized.selectedSwatch,
		selectedTool: getToolByName(serialized.selectedToolID),
		undos: new List(serialized.undos.map(deserializeOperation)),
		redos: new List(serialized.redos.map(deserializeOperation)),
	}];
}
