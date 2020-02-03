let id = 0;
const generateId = ()=> ++id;

export default class HistoryNode {
	constructor({parentNode, timestamp, operation}) {
		this.parentNode = parentNode;
		this.futures = []; // TODO: rename childNodes?
		this.timestamp = timestamp;
		this.operation = operation;
		this.name = this.operation ? this.operation.tool.name : "New document or whatever";
		this.id = generateId();
	}
}
