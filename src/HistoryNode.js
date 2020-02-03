let id = 0;
const generateId = ()=> ++id;

export default class HistoryNode {
	constructor({parentNode, timestamp, operation}) {
		this.parentNode = parentNode;
		this.timestamp = timestamp;
		this.operation = operation;
		this.id = generateId();
	}
}
