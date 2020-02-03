import { List } from "immutable";

export function goToHistoryNode(targetHistoryNode, {currentHistoryNode, redos, undos}) {
	const fromHistoryNode = currentHistoryNode;
	const oldHistoryPath =
		redos.size > 0 ?
			[redos.first(), ...getHistoryAncestors(redos.first())] :
			[fromHistoryNode, ...getHistoryAncestors(fromHistoryNode)];

	// finalizeAnyOperation();

	// ctx.copy(targetHistoryNode.imageData);
	
	const ancestorsOfTarget = getHistoryAncestors(targetHistoryNode);

	undos = new List([...ancestorsOfTarget].reverse());

	window.console && console.log("targetHistoryNode:", targetHistoryNode);
	window.console && console.log("ancestorsOfTarget:", ancestorsOfTarget);
	window.console && console.log("oldHistoryPath:", oldHistoryPath);
	redos = new List();

	let latestNode = targetHistoryNode;
	while (latestNode.futures.length > 0) {
		const futures = [...latestNode.futures];
		futures.sort((a, b)=> {
			if(oldHistoryPath.indexOf(a) > -1) {
				return -1;
			}
			if(oldHistoryPath.indexOf(b) > -1) {
				return +1;
			}
			return 0;
		});
		latestNode = futures[0];
		redos = redos.unshift(latestNode);
	}
	window.console && console.log("new undos:", undos);
	window.console && console.log("new redos:", redos);


	return { currentHistoryNode: targetHistoryNode, undos, redos };

	// updateHistoryView();
	// save();
}

/*
function undoable({name, icon}, callback){
	// saved = false;

	const beforeCallbackHistoryNode = currentHistoryNode;
	callback && callback();
	
	if (currentHistoryNode !== beforeCallbackHistoryNode) {
		showError({
			message:
				`History node switched during undoable callback for ${name}. This shouldn't happen.`,
			requestBugReport: true,
		});
		window.console && console.log(`History node switched during undoable callback for ${name}, from`, beforeCallbackHistoryNode, "to", currentHistoryNode);
	}

	redos.length = 0;
	undos.push(currentHistoryNode);

	const newHistoryNode = makeHistoryNode({
		operation,
		parentNode: currentHistoryNode,
		name,
		icon,
	});
	currentHistoryNode.futures.push(newHistoryNode);
	currentHistoryNode = newHistoryNode;

	updateHistoryView();
	save();
}
function makeOrUpdateUndoable(undoableMeta, undoableAction) {
	if (currentHistoryNode.futures.length === 0 && undoableMeta.match(currentHistoryNode)) {
		undoableAction();
		currentHistoryNode.imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		if (undoableMeta.updateName) {
			currentHistoryNode.name = undoableMeta.name;
		}
		updateHistoryView();
	} else {
		undoable(undoableMeta, undoableAction);
	}
}
*/
export function undo({currentHistoryNode, undos, redos}){
	if (undos.size < 1) {
		return {currentHistoryNode, undos, redos};
	}

	redos = redos.push(currentHistoryNode);
	let targetHistoryNode = undos.last();
	undos = undos.pop();

	return goToHistoryNode(targetHistoryNode, {currentHistoryNode, undos, redos});
}

export function redo({currentHistoryNode, undos, redos}){
	if (redos.size < 1) {
		// if (!historyWindowOpen && !historyPromptOpen) {
		// 	showMessage({
		// 		// message: <>Press <kbd>Ctrl+Shift+Y</kbd> at any time to open the History window.</>,
		// 		// extraButtons: <button onClick={showDocumentHistory}>Show History</button>,
		// 		message: <React.Fragment>
		// 			You can get back to any state using the history panel.
		// 		</React.Fragment>,
		// 	});
		// }
		return {currentHistoryNode, undos, redos};
	}

	undos = undos.push(currentHistoryNode);
	let targetHistoryNode = redos.last();
	redos = redos.pop();

	return goToHistoryNode(targetHistoryNode, {currentHistoryNode, undos, redos});
}

export function getHistoryAncestors(node) {
	const ancestors = [];
	for (node = node.parent; node; node = node.parent) {
		ancestors.push(node);
	}
	return ancestors;
}
