
function go_to_history_node(target_history_node) {
	const from_history_node = current_history_node;
	const old_history_path =
		redos.length > 0 ?
			[redos[0], ...get_history_ancestors(redos[0])] :
			[from_history_node, ...get_history_ancestors(from_history_node)];

	current_history_node = target_history_node;
	
	finalize_any_operation();

	ctx.copy(target_history_node.image_data);
	
	const ancestors_of_target = get_history_ancestors(target_history_node);

	undos = [...ancestors_of_target];
	undos.reverse();

	// window.console && console.log("target_history_node:", target_history_node);
	// window.console && console.log("ancestors_of_target:", ancestors_of_target);
	// window.console && console.log("old_history_path:", old_history_path);
	redos.length = 0;

	let latest_node = target_history_node;
	while (latest_node.futures.length > 0) {
		const futures = [...latest_node.futures];
		futures.sort((a, b)=> {
			if(old_history_path.indexOf(a) > -1) {
				return -1;
			}
			if(old_history_path.indexOf(b) > -1) {
				return +1;
			}
			return 0;
		});
		latest_node = futures[0];
		redos.unshift(latest_node);
	}
	// window.console && console.log("new undos:", undos);
	// window.console && console.log("new redos:", redos);

	update_history_view();
	save();
}

function undoable({name, icon}, callback){
	saved = false;

	const before_callback_history_node = current_history_node;
	callback && callback();
	
	if (current_history_node !== before_callback_history_node) {
		showError({
			message:
				`History node switched during undoable callback for ${name}. This shouldn't happen.`,
			requestBugReport: true,
		});
		window.console && console.log(`History node switched during undoable callback for ${name}, from`, before_callback_history_node, "to", current_history_node);
	}

	redos.length = 0;
	undos.push(current_history_node);

	const new_history_node = make_history_node({
		image_data,
		parent: current_history_node,
		name,
		icon,
	});
	current_history_node.futures.push(new_history_node);
	current_history_node = new_history_node;

	update_history_view();
	save();
}
function make_or_update_undoable(undoable_meta, undoable_action) {
	if (current_history_node.futures.length === 0 && undoable_meta.match(current_history_node)) {
		undoable_action();
		current_history_node.image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
		if (undoable_meta.update_name) {
			current_history_node.name = undoable_meta.name;
		}
		update_history_view();
	} else {
		undoable(undoable_meta, undoable_action);
	}
}
function undo(){
	if(undos.length<1){ return false; }

	redos.push(current_history_node);
	let target_history_node = undos.pop();

	go_to_history_node(target_history_node);

	return true;
}

function redo(){
	if(redos.length<1){
		if (!history_window_open && !history_prompt_open) {
			showMessage({
				// message: <>Press <kbd>Ctrl+Shift+Y</kbd> at any time to open the History window.</>,
				// extraButtons: <button onClick={show_document_history}>Show History</button>,
				message: <React.Fragment>
					You can get back to any state using the history panel.
				</React.Fragment>,
			});
		}
		return false;
	}

	undos.push(current_history_node);
	let target_history_node = redos.pop();

	go_to_history_node(target_history_node);

	return true;
}

export function getHistoryAncestors(node) {
	const ancestors = [];
	for (node = node.parent; node; node = node.parent) {
		ancestors.push(node);
	}
	return ancestors;
}

let $document_history_window;
function show_document_history() {

	const $history_view = $w.$content.find(".history-view");

	let previous_scroll_position = 0;

	$G.on("history-update", render_tree);
	$w.on("close", ()=> {
		$G.off("history-update", render_tree);
	});

	$w.center();
}
