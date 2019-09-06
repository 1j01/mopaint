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

window.digestHexesToMaybeTrust = [];
const trustedDigestHexes = [
	"8c783d1d71013d93bc6667e6af3001fa3c32cbbcbf2e067771baf2ee015f95e4"
];

export default function importModuleFromCodeIfTrusted(code) {
	return hash(code).then(digestHex => {
		window.digestHexesToMaybeTrust.push(digestHex);
		const allowed = trustedDigestHexes.includes(digestHex) || (()=> { try { return localStorage.disableSecurityAndTrustAnything } catch (e) {} })();
		console.log(allowed);
		if (allowed) {
			return importModuleFromCode(code);
		} else {
			throw new Error(`Untrusted code. (Digest '${digestHex}' is not in the list of allowed digests.)`);
		}
	});
};
