import pngChunksExtract from "png-chunks-extract";
import pngChunksEncode from "png-chunks-encode";
import pngChunkText from "png-chunk-text";

const readPngChunksFromBlob = (blob, callback) => {
	blob.arrayBuffer().then((arrayBuffer) => {
		const uint8Array = new Uint8Array(arrayBuffer);
		const chunks = pngChunksExtract(uint8Array);
		callback(null, chunks);
	}, callback);
};

export function injectMetadataIntoBlob(blob, metadata, callback) {
	readPngChunksFromBlob(blob, (error, chunks) => {
		if (error) {
			return callback(error);
		}
		for (const key of Object.keys(metadata)) {
			chunks.splice(-1, 0, pngChunkText.encode(key, metadata[key]));
		}
		const reencodedBuffer = pngChunksEncode(chunks);
		const reencodedBlob = new Blob([reencodedBuffer], { type: "image/png" });
		callback(null, reencodedBlob);
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
