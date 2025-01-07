// TODO maybe: more efficient IDs (don't need to restrict the alphabet to hex)
const byteToHex = (byte: number) => `0${byte.toString(16)}`.slice(-2);
export const generateID = (length = 40) => {
	// length must be an even number (default: 40)
	const array = new Uint8Array(length / 2);
	crypto.getRandomValues(array);
	return Array.from(array, byteToHex).join("");
};

export type ElementOfArray<A> = A extends readonly (infer T)[] ? T : never;
