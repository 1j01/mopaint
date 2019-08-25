import importModuleFromCode from "./import-module-from-code";

function hexString(buffer) {
	const byteArray = new Uint8Array(buffer);
	const hexCodes = [...byteArray].map(value => value.toString(16).padStart(2, "0"));
	return hexCodes.join("");
}

export function hash(message) {
	const encoder = new TextEncoder();
	const data = encoder.encode(message);
	return window.crypto.subtle.digest("SHA-256", data).then((digestValue)=> {
		const digestHex = hexString(digestValue);
		return digestHex;
	});
}

const trustedHashes = [
	"3a99b642793122283c10b1bc4ec26eca73d2b10cd0ce03d5277816c779af1984", // circle.js
];

export default function importModuleFromCodeIfTrusted(code) {
	return hash(code).then(digestHex => {
		const allowed = trustedHashes.includes(digestHex);
		console.log(allowed);
		if (allowed) {
			return importModuleFromCode(code);
		} else {
			throw new Error(`Untrusted code. (Digest '${digestHex}' is not in the list of allowed digests.)`);
		}
	});
};
