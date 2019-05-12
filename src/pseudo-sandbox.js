import importModuleFromCode from "./import-module-from-code";

function hexString(buffer) {
	const byteArray = new Uint8Array(buffer);
	const hexCodes = [...byteArray].map(value => value.toString(16).padStart(2, "0"));
	return hexCodes.join("");
}

function sha256(message) {
	const encoder = new TextEncoder();
	const data = encoder.encode(message);
	return window.crypto.subtle.digest("SHA-256", data);
}

const allowedDigestHexStrings = [
	"3a99b642793122283c10b1bc4ec26eca73d2b10cd0ce03d5277816c779af1984", // circle.js
];

export default function importModuleFromCodeIfTrusted(code) {
	return sha256(code).then(digestValue => {
		const digestHex = hexString(digestValue);
		console.log(digestHex);
		const allowed = allowedDigestHexStrings.includes(digestHex);
		console.log(allowed);
		if (allowed) {
			return importModuleFromCode(code);
		} else {
			throw new Error(`Untrusted code. (Digest '${digestHex}' is not in the list of allowed digests.)`);
		}
	});
};
importModuleFromCodeIfTrusted(`const circle = (ctx, x1, y1, x2, y2, swatch) => {
	const radius = Math.hypot(x2 - x1, y2 - y1);
	ctx.beginPath();
	ctx.arc(x1, y1, radius, 0, Math.PI * 2);
	ctx.fillStyle = swatch;
	ctx.fill();
};

export default circle;`).then((module)=> {
	const toolFunction = module.default;
	console.log(toolFunction);
});
