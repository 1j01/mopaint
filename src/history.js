import { List } from "immutable";

export function goToHistoryNode(targetHistoryNode, {currentHistoryNode, redos, undos}) {
	const fromHistoryNode = currentHistoryNode;
	const oldHistoryPath =
		redos.size > 0 ?
			[redos.first(), ...getHistoryAncestors(redos.first())] :
			[fromHistoryNode, ...getHistoryAncestors(fromHistoryNode)];

	const ancestorsOfTarget = getHistoryAncestors(targetHistoryNode);

	undos = new List([...ancestorsOfTarget].reverse());

	// window.console && console.log("targetHistoryNode:", targetHistoryNode);
	// window.console && console.log("ancestorsOfTarget:", ancestorsOfTarget);
	// window.console && console.log("oldHistoryPath:", oldHistoryPath);
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
	// window.console && console.log("new undos:", undos);
	// window.console && console.log("new redos:", redos);

	return { currentHistoryNode: targetHistoryNode, undos, redos };
}

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
		// 		message: <React.Fragment>
		// 			You can get back to <strong>any state</strong> using the history panel.
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
	for (node = node.parentNode; node; node = node.parentNode) {
		ancestors.push(node);
	}
	return ancestors;
}
