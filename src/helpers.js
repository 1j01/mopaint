// TODO maybe: more efficient IDs (don't need to restrict the alphabet to hex)
const byteToHex = (byte) => `0${byte.toString(16)}`.slice(-2);
export const generateID = (length = 40) => {
	// length must be an even number (default: 40)
	const array = new Uint8Array(length / 2);
	crypto.getRandomValues(array);
	return Array.from(array, byteToHex).join("");
};


/**
 * @template {any[]} ArgsType
 * @returns {(callback: (...args: ArgsType) => void) => (() => void) & { trigger: (...args: ArgsType) => void }} addListener
 */
export const makeListenable = () => {
	/** @type {Set<((...args: ArgsType) => void)>} */
	let eventHandlers = [];

	const addListener = (/** @type {(...args: ArgsType) => void} */ callback) => {
		eventHandlers.add(callback);

		const dispose = () => {
			eventHandlers.delete(callback);
		};

		return dispose;
	};

	/**
	 * @param {ArgsType} args
	 */
	const trigger = (...args) => {
		for (const handler of eventHandlers) {
			handler(...args);
		}
	};
	return Object.assign(addListener, { trigger });
};
