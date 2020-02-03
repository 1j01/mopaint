import {generateID} from "./helpers.js";

export default class HistoryNode {
	// NOTE: data may be freely changed after construction, this is basically just a struct
	constructor({parentNode, timestamp, operation, name, id}) {
		this.parentNode = parentNode;
		this.futures = []; // TODO: rename childNodes?
		this.timestamp = timestamp ?? Date.now();
		this.operation = operation;
		this.name = name;
		this.id = id ?? generateID();
	}
}
