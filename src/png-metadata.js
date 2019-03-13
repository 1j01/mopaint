import pngChunksExtract from "png-chunks-extract";
import pngChunksEncode from "png-chunks-encode";
import pngChunkText from "png-chunk-text";

const readPngChunksFromBlob = (blob, callback) => {
	const fileReader = new FileReader();
	fileReader.onload = () => {
		const arrayBuffer = fileReader.result;
		const uint8Array = new Uint8Array(arrayBuffer);
		const chunks = pngChunksExtract(uint8Array);
		callback(chunks);
	};
	fileReader.readAsArrayBuffer(blob);
};

export function injectMetadataIntoBlob(blob, metadata, callback) {
	readPngChunksFromBlob(blob, (chunks) => {
		for (let k in metadata) {
			if (metadata.hasOwnProperty(k)) {
				chunks.splice(-1, 0, pngChunkText.encode(k, metadata[k]));
			}
		}
		const reencodedBuffer = pngChunksEncode(chunks);
		const reencodedBlob = new Blob([reencodedBuffer], { type: "image/png" });
		callback(reencodedBlob);
	});
}

export function readMetadataSync(uint8Array) {
	const chunks = pngChunksExtract(uint8Array);

	const textChunks = chunks
		.filter((chunk) => chunk.name === "tEXt")
		.map((chunk) => pngChunkText.decode(chunk.data));

	const metadata = {};

	for (let i = 0; i < textChunks.length; i++) {
		const textChunk = textChunks[i];
		metadata[textChunk.keyword] = textChunk.text;
	}

	return metadata;
}
