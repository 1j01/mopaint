
// TODO: DRY
// TODO maybe: more efficient IDs (don't need to restrict the alphabet to hex)
const byteToHex = (byte) => `0${byte.toString(16)}`.slice(-2);
const generateID = (length = 40) => {
	// length must be an even number (default: 40)
	const array = new Uint8Array(length / 2);
	crypto.getRandomValues(array);
	return Array.from(array, byteToHex).join("");
};

export default class HistoryNode {
	// NOTE: data may be freely changed after construction, this is basically just a struct
	constructor({parentNode, timestamp, operation, name, id}) {
		this.parentNode = parentNode;
		this.futures = []; // TODO: rename childNodes?
		this.timestamp = timestamp;
		this.operation = operation;
		this.name = name;
		this.id = id || generateID();
	}
}
