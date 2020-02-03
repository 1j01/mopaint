let id = 0;
const generateId = ()=> ++id;

export default class HistoryNode {
	constructor({parentNode, timestamp, operation, name}) {
		this.parentNode = parentNode;
		this.futures = []; // TODO: rename childNodes?
		this.timestamp = timestamp;
		this.operation = operation;
		this.name = name;
		this.id = generateId();
	}
}
