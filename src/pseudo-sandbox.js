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

const allowedCodeDigestHexStrings = [
	"3a99b642793122283c10b1bc4ec26eca73d2b10cd0ce03d5277816c779af1984", // circle.js
];

const code = `const circle = (ctx, x1, y1, x2, y2, swatch) => {
	const radius = Math.hypot(x2 - x1, y2 - y1);
	ctx.beginPath();
	ctx.arc(x1, y1, radius, 0, Math.PI * 2);
	ctx.fillStyle = swatch;
	ctx.fill();
};

export default circle;`;

sha256(code).then(digestValue => {
	const digestHex = hexString(digestValue);
	console.log(digestHex);
	const allowed = allowedCodeDigestHexStrings.includes(digestHex);
	console.log(allowed);
	if (allowed) {
		importModuleFromCode(code).then((module)=> {
			console.log(module.default)
		});
	}
});
